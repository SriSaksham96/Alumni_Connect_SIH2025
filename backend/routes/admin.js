const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const News = require('../models/News');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requirePermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/events
// @desc    Get all events for admin management
// @access  Private (Admin only)
router.get('/events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filters = {};

    // Filter by status
    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Filter by event type
    if (req.query.eventType) {
      filters.eventType = req.query.eventType;
    }

    // Search by title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filters.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    const events = await Event.find(filters)
      .populate('organizer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(filters);

    res.json({
      events,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin get events error:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// @route   PUT /api/admin/events/:id
// @desc    Update event (Admin only)
// @access  Private (Admin only)
router.put('/events/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1, max: 2000 }),
  body('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']),
  body('isFeatured').optional().isBoolean(),
  body('isPublic').optional().isBoolean()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        event[key] = updates[key];
      }
    });

    await event.save();

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Admin update event error:', error);
    res.status(500).json({ message: 'Server error updating event' });
  }
});

// @route   DELETE /api/admin/events/:id
// @desc    Delete event (Admin only)
// @access  Private (Admin only)
router.delete('/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Admin delete event error:', error);
    res.status(500).json({ message: 'Server error deleting event' });
  }
});

// @route   GET /api/admin/news
// @desc    Get all news articles for admin management
// @access  Private (Admin only)
router.get('/news', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filters = {};

    // Filter by status
    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Filter by category
    if (req.query.category) {
      filters.category = req.query.category;
    }

    // Search by title or content
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filters.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { excerpt: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    const news = await News.find(filters)
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments(filters);

    res.json({
      news,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNews: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin get news error:', error);
    res.status(500).json({ message: 'Server error fetching news' });
  }
});

// @route   PUT /api/admin/news/:id
// @desc    Update news article (Admin only)
// @access  Private (Admin only)
router.put('/news/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().trim().isLength({ min: 1, max: 10000 }),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('isFeatured').optional().isBoolean(),
  body('isPublic').optional().isBoolean()
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const article = await News.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'News article not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        article[key] = updates[key];
      }
    });

    await article.save();

    res.json({
      message: 'News article updated successfully',
      article
    });
  } catch (error) {
    console.error('Admin update news error:', error);
    res.status(500).json({ message: 'Server error updating news article' });
  }
});

// @route   DELETE /api/admin/news/:id
// @desc    Delete news article (Admin only)
// @access  Private (Admin only)
router.delete('/news/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const article = await News.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'News article not found' });
    }

    await News.findByIdAndDelete(req.params.id);

    res.json({ message: 'News article deleted successfully' });
  } catch (error) {
    console.error('Admin delete news error:', error);
    res.status(500).json({ message: 'Server error deleting news article' });
  }
});

// @route   GET /api/admin/campaigns
// @desc    Get all campaigns for admin management
// @access  Private (Admin only)
router.get('/campaigns', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filters = {};

    // Filter by status
    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Filter by category
    if (req.query.category) {
      filters.category = req.query.category;
    }

    // Search by title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filters.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    const campaigns = await Campaign.find(filters)
      .populate('organizer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(filters);

    res.json({
      campaigns,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCampaigns: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin get campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching campaigns' });
  }
});

// @route   PUT /api/admin/campaigns/:id
// @desc    Update campaign (Admin only)
// @access  Private (Admin only)
router.put('/campaigns/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1, max: 2000 }),
  body('status').optional().isIn(['draft', 'active', 'paused', 'completed', 'cancelled']),
  body('isFeatured').optional().isBoolean(),
  body('isPublic').optional().isBoolean(),
  body('targetAmount').optional().isFloat({ min: 1 })
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        campaign[key] = updates[key];
      }
    });

    await campaign.save();

    res.json({
      message: 'Campaign updated successfully',
      campaign
    });
  } catch (error) {
    console.error('Admin update campaign error:', error);
    res.status(500).json({ message: 'Server error updating campaign' });
  }
});

// @route   DELETE /api/admin/campaigns/:id
// @desc    Delete campaign (Admin only)
// @access  Private (Admin only)
router.delete('/campaigns/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Admin delete campaign error:', error);
    res.status(500).json({ message: 'Server error deleting campaign' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalEvents,
      publishedEvents,
      totalNews,
      publishedNews,
      totalCampaigns,
      activeCampaigns,
      totalDonations,
      completedDonations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'published' }),
      News.countDocuments(),
      News.countDocuments({ status: 'published' }),
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'active' }),
      // Note: Donation model might need to be imported
      // Donation.countDocuments(),
      // Donation.countDocuments({ paymentStatus: 'completed' })
      0, // Placeholder for donations
      0  // Placeholder for completed donations
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const roleStats = {};
    usersByRole.forEach(role => {
      roleStats[role._id] = role.count;
    });

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalEvents,
        publishedEvents,
        totalNews,
        publishedNews,
        totalCampaigns,
        activeCampaigns,
        totalDonations,
        completedDonations
      },
      usersByRole: roleStats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

module.exports = router;
