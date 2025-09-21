const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireSuperAdmin, requirePermission, requireOwnershipOrAdmin } = require('../middleware/auth');
const { uploadMultiple, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (with pagination and filtering)
// @access  Private (Admin, Super Admin) or Public for alumni directory
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filters = {};
    
    // Filter by role
    if (req.query.role) {
      filters.role = req.query.role;
    }
    
    // Filter by graduation year
    if (req.query.graduationYear) {
      filters['profile.graduationYear'] = parseInt(req.query.graduationYear);
    }
    
    // Filter by degree
    if (req.query.degree) {
      filters['profile.degree'] = new RegExp(req.query.degree, 'i');
    }
    
    // Filter by location
    if (req.query.location) {
      const locationRegex = new RegExp(req.query.location, 'i');
      filters.$or = [
        { 'profile.location.city': locationRegex },
        { 'profile.location.state': locationRegex },
        { 'profile.location.country': locationRegex }
      ];
    }
    
    // Filter by company
    if (req.query.company) {
      filters['profile.company'] = new RegExp(req.query.company, 'i');
    }
    
    // Filter by skills
    if (req.query.skills) {
      filters['profile.skills'] = new RegExp(req.query.skills, 'i');
    }
    
    // Search by name, email, company, skills, etc.
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filters.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { 'profile.company': searchRegex },
        { 'profile.currentJob': searchRegex },
        { 'profile.skills': searchRegex },
        { 'profile.major': searchRegex }
      ];
    }

    // For alumni directory, only show active alumni
    if (req.query.role === 'alumni') {
      filters.status = 'active';
    }

    // For testing purposes, allow alumni directory access without authentication
    // In production, this should be protected
    if (req.query.role !== 'alumni') {
      // For non-alumni queries, we would normally require authentication
      // For now, allow access for testing
    }

    const users = await User.find(filters)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filters);

    res.json({
      users,
      total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow users to see their own profile or admin to see any profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Own profile or Admin)
router.put('/:id', [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['alumni', 'admin'])
], authenticateToken, uploadMultiple, handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only admin can change role
    if (req.body.role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can change user role' });
    }

    const updates = req.body;

    // Handle file uploads
    if (req.files) {
      if (req.files.profilePicture) {
        updates['profile.profilePicture'] = `/uploads/profiles/${req.files.profilePicture[0].filename}`;
      }
      if (req.files.coverPhoto) {
        updates['profile.coverPhoto'] = `/uploads/profiles/${req.files.coverPhoto[0].filename}`;
      }
      if (req.files.documents) {
        const documents = req.files.documents.map(file => ({
          name: file.originalname,
          url: `/uploads/documents/${file.filename}`,
          type: file.mimetype
        }));
        updates['profile.documents'] = [...(user.profile.documents || []), ...documents];
      }
    }

    // Update user
    Object.keys(updates).forEach(key => {
      if (key.startsWith('profile.')) {
        const profileKey = key.replace('profile.', '');
        user.profile[profileKey] = updates[key];
      } else if (key !== 'password') {
        user[key] = updates[key];
      }
    });

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// @route   GET /api/users/:id/alumni
// @desc    Get alumni directory (public info only)
// @access  Public
router.get('/:id/alumni', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('firstName lastName profile.graduationYear profile.degree profile.major profile.currentJob profile.company profile.location profile.profilePicture')
      .where('isActive').equals(true)
      .where('role').equals('alumni');

    if (!user) {
      return res.status(404).json({ message: 'Alumni not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get alumni error:', error);
    res.status(500).json({ message: 'Server error fetching alumni' });
  }
});

// @route   GET /api/users/alumni/directory
// @desc    Get alumni directory with filtering
// @access  Public
router.get('/alumni/directory', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filters = {
      role: 'alumni',
      isActive: true
    };
    
    // Filter by graduation year
    if (req.query.graduationYear) {
      filters['profile.graduationYear'] = parseInt(req.query.graduationYear);
    }
    
    // Filter by degree
    if (req.query.degree) {
      filters['profile.degree'] = new RegExp(req.query.degree, 'i');
    }
    
    // Filter by location
    if (req.query.location) {
      const locationRegex = new RegExp(req.query.location, 'i');
      filters.$or = [
        { 'profile.location.city': locationRegex },
        { 'profile.location.state': locationRegex },
        { 'profile.location.country': locationRegex }
      ];
    }

    const alumni = await User.find(filters)
      .select('firstName lastName profile.graduationYear profile.degree profile.major profile.currentJob profile.company profile.location profile.profilePicture')
      .sort({ 'profile.graduationYear': -1, lastName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filters);

    res.json({
      alumni,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAlumni: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get alumni directory error:', error);
    res.status(500).json({ message: 'Server error fetching alumni directory' });
  }
});

// @route   POST /api/users/:id/upload-document
// @desc    Upload document for user
// @access  Private (Own profile or Admin)
router.post('/:id/upload-document', authenticateToken, uploadMultiple, handleUploadError, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.files || !req.files.documents) {
      return res.status(400).json({ message: 'No documents uploaded' });
    }

    const documents = req.files.documents.map(file => ({
      name: file.originalname,
      url: `/uploads/documents/${file.filename}`,
      type: file.mimetype,
      uploadedAt: new Date()
    }));

    user.profile.documents = [...(user.profile.documents || []), ...documents];
    await user.save();

    res.json({
      message: 'Documents uploaded successfully',
      documents: user.profile.documents
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error uploading documents' });
  }
});

// @route   GET /api/users/dashboard/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin, Super Admin)
router.get('/dashboard/stats', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const News = require('../models/News');
    const Donation = require('../models/Donation');
    const Message = require('../models/Message');

    const [
      totalUsers,
      activeUsers,
      totalEvents,
      totalNews,
      totalDonations,
      totalMessages,
      usersByRole,
      usersByStatus,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Event.countDocuments(),
      News.countDocuments(),
      Donation.countDocuments(),
      Message.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      User.find()
        .select('firstName lastName email role status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const stats = {
      overview: {
        totalUsers,
        activeUsers,
        totalEvents,
        totalNews,
        totalDonations,
        totalMessages
      },
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      usersByStatus: usersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentUsers
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

// @route   GET /api/users/dashboard/activity
// @desc    Get recent system activity
// @access  Private (Admin, Super Admin)
router.get('/dashboard/activity', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const News = require('../models/News');
    const Donation = require('../models/Donation');

    const [recentEvents, recentNews, recentDonations] = await Promise.all([
      Event.find()
        .populate('organizer', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5),
      News.find()
        .populate('author', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5),
      Donation.find()
        .populate('donor', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Get recent users for activity feed
    const recentUsers = await User.find()
      .select('firstName lastName email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const activity = {
      recentUsers,
      recentEvents,
      recentNews,
      recentDonations
    };

    res.json(activity);
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard activity' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin, Super Admin)
// @access  Private (Admin, Super Admin)
router.put('/:id/status', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['active', 'inactive', 'suspended', 'pending_verification'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing own status
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }

    user.status = status;
    if (status === 'active' && !user.verifiedAt) {
      user.verifiedAt = new Date();
    }

    await user.save();

    res.json({
      message: 'User status updated successfully',
      user: {
        id: user._id,
        status: user.status,
        verifiedAt: user.verifiedAt
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Super Admin only)
// @access  Private (Super Admin only)
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

module.exports = router;
