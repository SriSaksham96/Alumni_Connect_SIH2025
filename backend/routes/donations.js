const express = require('express');
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requirePermission, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/donations
// @desc    Get all donations with filtering and pagination
// @access  Private (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filters = {};

    // Filter by payment status
    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus;
    }

    // Filter by purpose
    if (req.query.purpose) {
      filters.purpose = req.query.purpose;
    }

    // Filter by campaign
    if (req.query.campaign) {
      filters.campaign = req.query.campaign;
    }

    // Filter by date range
    if (req.query.startDate) {
      filters.createdAt = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      filters.createdAt = { ...filters.createdAt, $lte: new Date(req.query.endDate) };
    }

    // Filter by amount range
    if (req.query.minAmount) {
      filters.amount = { $gte: parseFloat(req.query.minAmount) };
    }
    if (req.query.maxAmount) {
      filters.amount = { ...filters.amount, $lte: parseFloat(req.query.maxAmount) };
    }

    const donations = await Donation.find(filters)
      .populate('donor', 'firstName lastName email profile.profilePicture')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments(filters);

    res.json({
      donations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDonations: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ message: 'Server error fetching donations' });
  }
});

// @route   GET /api/donations/user
// @desc    Get user's donations
// @access  Private
router.get('/user', async (req, res) => {
  try {
    // If no authenticated user, return empty donations
    if (!req.user || !req.user._id) {
      return res.json({
        donations: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalDonations: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const donations = await Donation.find({ donor: req.user._id })
      .populate('campaign', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments({ donor: req.user._id });

    res.json({
      donations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDonations: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({ message: 'Server error fetching user donations' });
  }
});

// @route   POST /api/donations
// @desc    Create new donation
// @access  Private
router.post('/', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid donation amount is required'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  body('purpose').optional().isIn(['general', 'scholarship', 'facilities', 'research', 'events', 'emergency', 'other']),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'check', 'cash', 'other']).withMessage('Valid payment method is required'),
  body('campaign').optional().isMongoId().withMessage('Valid campaign ID is required'),
  body('isAnonymous').optional().isBoolean(),
  body('isRecurring').optional().isBoolean()
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const donationData = req.body;
    donationData.donor = req.user._id;

    // Check if campaign exists
    if (donationData.campaign) {
      const campaign = await Campaign.findById(donationData.campaign);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      if (!campaign.isActive()) {
        return res.status(400).json({ message: 'Campaign is not active' });
      }
    }

    // Generate transaction ID (in a real app, this would come from payment gateway)
    donationData.transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const donation = new Donation(donationData);
    await donation.save();

    // Update campaign amount if applicable
    if (donationData.campaign) {
      await Campaign.findByIdAndUpdate(donationData.campaign, {
        $inc: { currentAmount: donationData.amount }
      });
    }

    await donation.populate('donor', 'firstName lastName email');
    await donation.populate('campaign', 'title');

    res.status(201).json({
      message: 'Donation created successfully',
      donation
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ message: 'Server error creating donation' });
  }
});

// @route   GET /api/donations/stats
// @desc    Get donation statistics
// @access  Public
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const filters = { paymentStatus: 'completed' };

    // If not admin, only show public stats
    if (!req.user || req.user.role !== 'admin') {
      // You might want to limit what non-admin users can see
    }

    const stats = await Donation.getStats(filters);
    const donationsByPeriod = await Donation.getDonationsByPeriod('month', filters);

    // Get top donors (if admin)
    let topDonors = [];
    if (req.user && req.user.role === 'admin') {
      topDonors = await Donation.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: '$donor',
            totalAmount: { $sum: '$amount' },
            donationCount: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'donor'
          }
        },
        { $unwind: '$donor' },
        {
          $project: {
            donor: {
              firstName: 1,
              lastName: 1,
              profile: { profilePicture: 1 }
            },
            totalAmount: 1,
            donationCount: 1
          }
        }
      ]);
    }

    res.json({
      stats,
      donationsByPeriod,
      topDonors
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ message: 'Server error fetching donation stats' });
  }
});

// @route   POST /api/donations/campaigns
// @desc    Create new campaign
// @access  Private (Alumni, Admin, Super Admin)
router.post('/campaigns', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Campaign title is required'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Campaign description is required'),
  body('targetAmount').isFloat({ min: 1 }).withMessage('Valid target amount is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('category').optional().isIn(['scholarship', 'facilities', 'research', 'emergency', 'events', 'general', 'other'])
], authenticateToken, requirePermission('create_campaigns'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const campaignData = req.body;
    campaignData.organizer = req.user._id;
    campaignData.status = 'active'; // Set campaigns to active by default

    const campaign = new Campaign(campaignData);
    await campaign.save();

    await campaign.populate('organizer', 'firstName lastName profile.profilePicture');

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error creating campaign' });
  }
});

// @route   GET /api/donations/campaigns
// @desc    Get active campaigns
// @access  Public
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      status: 'active',
      isPublic: true
    })
    .populate('organizer', 'firstName lastName profile.profilePicture')
    .sort({ createdAt: -1 });

    res.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error fetching campaigns' });
  }
});

// @route   GET /api/donations/:id
// @desc    Get donation by ID
// @access  Private (Donor or Admin)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'firstName lastName email profile.profilePicture')
      .populate('campaign', 'title');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Check if user can view this donation
    if (req.user.role !== 'admin' && donation.donor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(donation);
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({ message: 'Server error fetching donation' });
  }
});

// @route   PUT /api/donations/:id/status
// @desc    Update donation status
// @access  Private (Admin only)
router.put('/:id/status', [
  body('paymentStatus').isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled']).withMessage('Valid payment status is required')
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const oldStatus = donation.paymentStatus;
    donation.paymentStatus = req.body.paymentStatus;
    donation.processedBy = req.user._id;
    donation.processedAt = new Date();

    await donation.save();

    // Update campaign amount if status changed to/from completed
    if (donation.campaign) {
      if (oldStatus !== 'completed' && req.body.paymentStatus === 'completed') {
        await Campaign.findByIdAndUpdate(donation.campaign, {
          $inc: { currentAmount: donation.amount }
        });
      } else if (oldStatus === 'completed' && req.body.paymentStatus !== 'completed') {
        await Campaign.findByIdAndUpdate(donation.campaign, {
          $inc: { currentAmount: -donation.amount }
        });
      }
    }

    res.json({
      message: 'Donation status updated successfully',
      donation
    });
  } catch (error) {
    console.error('Update donation status error:', error);
    res.status(500).json({ message: 'Server error updating donation status' });
  }
});

// @route   GET /api/donations/stats
// @desc    Get donation statistics
// @access  Public
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const filters = { paymentStatus: 'completed' };

    // If not admin, only show public stats
    if (!req.user || req.user.role !== 'admin') {
      // You might want to limit what non-admin users can see
    }

    const stats = await Donation.getStats(filters);
    const donationsByPeriod = await Donation.getDonationsByPeriod('month', filters);

    // Get top donors (if admin)
    let topDonors = [];
    if (req.user && req.user.role === 'admin') {
      topDonors = await Donation.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: '$donor',
            totalAmount: { $sum: '$amount' },
            donationCount: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'donor'
          }
        },
        { $unwind: '$donor' },
        {
          $project: {
            donor: {
              firstName: 1,
              lastName: 1,
              profile: { profilePicture: 1 }
            },
            totalAmount: 1,
            donationCount: 1
          }
        }
      ]);
    }

    res.json({
      stats,
      donationsByPeriod,
      topDonors
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ message: 'Server error fetching donation stats' });
  }
});

module.exports = router;
