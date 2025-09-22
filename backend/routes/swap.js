const express = require('express');
const { body, validationResult } = require('express-validator');
const SwapOffer = require('../models/SwapOffer');
const SwapRequest = require('../models/SwapRequest');
const SwapTransaction = require('../models/SwapTransaction');
const User = require('../models/User');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/swap/offers
// @desc    Get all swap offers with filtering and search
// @access  Private
router.get('/offers', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filters = {
      status: 'active',
      isPublic: true
    };

    // Filter by category
    if (req.query.category) {
      filters.category = req.query.category;
    }

    // Filter by subcategory
    if (req.query.subcategory) {
      filters.subcategory = new RegExp(req.query.subcategory, 'i');
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
      filters.tags = { $in: tags };
    }

    // Filter by location (if user location is provided)
    if (req.query.lat && req.query.lng && req.query.radius) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseFloat(req.query.radius) / 6371; // Convert km to radians

      filters['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius]
        }
      };
    }

    // Search by text
    if (req.query.search) {
      filters.$text = { $search: req.query.search };
    }

    // Filter by user (exclude current user's offers)
    if (req.query.excludeUser) {
      filters.user = { $ne: req.user._id };
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sort === 'rating') {
      sort = { 'rating.average': -1, 'rating.count': -1 };
    } else if (req.query.sort === 'views') {
      sort = { views: -1 };
    } else if (req.query.sort === 'distance' && req.query.lat && req.query.lng) {
      // This would require aggregation pipeline for distance sorting
      sort = { createdAt: -1 };
    }

    const offers = await SwapOffer.find(filters)
      .populate('user', 'firstName lastName email profile.profilePicture profile.swap.swapStats profile.verification')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await SwapOffer.countDocuments(filters);

    res.json({
      offers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOffers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get swap offers error:', error);
    res.status(500).json({ message: 'Server error fetching swap offers' });
  }
});

// @route   GET /api/swap/offers/:id
// @desc    Get single swap offer details
// @access  Private
router.get('/offers/:id', authenticateToken, async (req, res) => {
  try {
    const offer = await SwapOffer.findById(req.params.id)
      .populate('user', 'firstName lastName email profile.profilePicture profile.swap profile.verification profile.location');

    if (!offer) {
      return res.status(404).json({ message: 'Swap offer not found' });
    }

    // Increment view count
    await offer.incrementViews();

    // Get related offers from the same user
    const relatedOffers = await SwapOffer.find({
      user: offer.user._id,
      _id: { $ne: offer._id },
      status: 'active'
    }).limit(3);

    res.json({
      offer,
      relatedOffers
    });
  } catch (error) {
    console.error('Get swap offer error:', error);
    res.status(500).json({ message: 'Server error fetching swap offer' });
  }
});

// @route   POST /api/swap/offers
// @desc    Create a new swap offer
// @access  Private (Alumni, Admin, Super Admin)
router.post('/offers', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required and must be less than 2000 characters'),
  body('category').isIn(['skill', 'service', 'accommodation', 'item', 'other']).withMessage('Valid category is required'),
  body('subcategory').trim().isLength({ min: 1, max: 100 }).withMessage('Subcategory is required'),
  body('wantsInReturn').trim().isLength({ min: 1, max: 1000 }).withMessage('What you want in return is required'),
  body('estimatedValue.amount').optional().isNumeric().withMessage('Estimated value must be a number'),
  body('estimatedValue.currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
], authenticateToken, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const offerData = {
      ...req.body,
      user: req.user._id
    };

    // Validate accommodation-specific fields
    if (offerData.category === 'accommodation') {
      if (!offerData.accommodation || !offerData.accommodation.propertyType) {
        return res.status(400).json({ message: 'Property type is required for accommodation offers' });
      }
      if (!offerData.accommodation.maxGuests || offerData.accommodation.maxGuests < 1) {
        return res.status(400).json({ message: 'Maximum guests must be at least 1' });
      }
    }

    const offer = new SwapOffer(offerData);
    await offer.save();

    // Update user's swap stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'profile.swap.swapStats.totalOffers': 1 }
    });

    await offer.populate('user', 'firstName lastName email profile.profilePicture');

    res.status(201).json({
      message: 'Swap offer created successfully',
      offer
    });
  } catch (error) {
    console.error('Create swap offer error:', error);
    res.status(500).json({ message: 'Server error creating swap offer' });
  }
});

// @route   PUT /api/swap/offers/:id
// @desc    Update a swap offer
// @access  Private (Owner only)
router.put('/offers/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1, max: 2000 }),
  body('status').optional().isIn(['active', 'inactive', 'paused', 'completed'])
], authenticateToken, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const offer = await SwapOffer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Swap offer not found' });
    }

    // Only admins/super admins can update offers

    Object.assign(offer, req.body);
    await offer.save();

    res.json({
      message: 'Swap offer updated successfully',
      offer
    });
  } catch (error) {
    console.error('Update swap offer error:', error);
    res.status(500).json({ message: 'Server error updating swap offer' });
  }
});

// @route   DELETE /api/swap/offers/:id
// @desc    Delete a swap offer
// @access  Private (Owner only)
router.delete('/offers/:id', authenticateToken, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const offer = await SwapOffer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'Swap offer not found' });
    }

    // Only admins/super admins can delete offers

    // Check if there are any pending requests
    const pendingRequests = await SwapRequest.countDocuments({
      offer: offer._id,
      status: { $in: ['pending', 'accepted', 'negotiating', 'confirmed', 'in_progress'] }
    });

    if (pendingRequests > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete offer with pending or active requests' 
      });
    }

    await SwapOffer.findByIdAndDelete(req.params.id);

    // Update user's swap stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'profile.swap.swapStats.totalOffers': -1 }
    });

    res.json({ message: 'Swap offer deleted successfully' });
  } catch (error) {
    console.error('Delete swap offer error:', error);
    res.status(500).json({ message: 'Server error deleting swap offer' });
  }
});

// @route   POST /api/swap/requests
// @desc    Create a swap request
// @access  Private
router.post('/requests', [
  body('offerId').isMongoId().withMessage('Valid offer ID is required'),
  body('offerInReturn.title').trim().isLength({ min: 1, max: 200 }).withMessage('Offer title is required'),
  body('offerInReturn.description').trim().isLength({ min: 1, max: 1000 }).withMessage('Offer description is required'),
  body('offerInReturn.category').isIn(['skill', 'service', 'accommodation', 'item', 'other']).withMessage('Valid category is required'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { offerId, offerInReturn, message, proposedTerms, timeline } = req.body;

    // Check if offer exists and is active
    const offer = await SwapOffer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Swap offer not found' });
    }

    if (offer.status !== 'active') {
      return res.status(400).json({ message: 'This offer is not currently active' });
    }

    if (offer.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot request your own offer' });
    }

    // Check if user already has a pending request for this offer
    const existingRequest = await SwapRequest.findOne({
      requester: req.user._id,
      offer: offerId,
      status: { $in: ['pending', 'accepted', 'negotiating', 'confirmed', 'in_progress'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this offer' });
    }

    const requestData = {
      requester: req.user._id,
      offerOwner: offer.user,
      offer: offerId,
      offerInReturn,
      message,
      proposedTerms,
      timeline
    };

    const request = new SwapRequest(requestData);
    await request.save();

    // Increment offer request count
    await offer.incrementRequests();

    // Update user's swap stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'profile.swap.swapStats.totalRequests': 1 }
    });

    await request.populate([
      { path: 'requester', select: 'firstName lastName email profile.profilePicture' },
      { path: 'offerOwner', select: 'firstName lastName email profile.profilePicture' },
      { path: 'offer', select: 'title description category' }
    ]);

    res.status(201).json({
      message: 'Swap request sent successfully',
      request
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({ message: 'Server error creating swap request' });
  }
});

// @route   GET /api/swap/requests
// @desc    Get user's swap requests (sent and received)
// @access  Private
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      $or: [
        { requester: req.user._id },
        { offerOwner: req.user._id }
      ]
    };

    // Filter by status
    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Filter by type (sent/received)
    if (req.query.type === 'sent') {
      filters.requester = req.user._id;
      delete filters.$or;
    } else if (req.query.type === 'received') {
      filters.offerOwner = req.user._id;
      delete filters.$or;
    }

    const requests = await SwapRequest.find(filters)
      .populate('requester', 'firstName lastName email profile.profilePicture')
      .populate('offerOwner', 'firstName lastName email profile.profilePicture')
      .populate('offer', 'title description category subcategory')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SwapRequest.countDocuments(filters);

    res.json({
      requests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ message: 'Server error fetching swap requests' });
  }
});

// @route   PUT /api/swap/requests/:id/respond
// @desc    Respond to a swap request
// @access  Private (Offer owner only)
router.put('/requests/:id/respond', [
  body('status').isIn(['accepted', 'rejected', 'negotiating']).withMessage('Valid status is required'),
  body('message').optional().trim().isLength({ max: 1000 }).withMessage('Message must be less than 1000 characters')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, message } = req.body;

    const request = await SwapRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (request.offerOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only respond to requests for your offers' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been responded to' });
    }

    request.status = status;
    if (message) {
      request.messages.push({
        sender: req.user._id,
        message: message,
        timestamp: new Date()
      });
    }

    await request.save();

    await request.populate([
      { path: 'requester', select: 'firstName lastName email profile.profilePicture' },
      { path: 'offerOwner', select: 'firstName lastName email profile.profilePicture' },
      { path: 'offer', select: 'title description category' }
    ]);

    res.json({
      message: `Swap request ${status} successfully`,
      request
    });
  } catch (error) {
    console.error('Respond to swap request error:', error);
    res.status(500).json({ message: 'Server error responding to swap request' });
  }
});

// @route   POST /api/swap/requests/:id/message
// @desc    Add message to swap request
// @access  Private (Participants only)
router.post('/requests/:id/message', [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message is required')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    const request = await SwapRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    // Check if user is participant
    if (request.requester.toString() !== req.user._id.toString() && 
        request.offerOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only message participants of this request' });
    }

    await request.addMessage(req.user._id, message);

    res.json({
      message: 'Message added successfully',
      request
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ message: 'Server error adding message' });
  }
});

// @route   GET /api/swap/recommendations
// @desc    Get personalized swap recommendations
// @access  Private
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const recommendations = [];

    // Get offers based on user's preferred categories
    if (user.profile.swap.swapPreferences.preferredCategories.length > 0) {
      const categoryOffers = await SwapOffer.find({
        category: { $in: user.profile.swap.swapPreferences.preferredCategories },
        status: 'active',
        isPublic: true,
        user: { $ne: req.user._id }
      })
      .populate('user', 'firstName lastName email profile.profilePicture profile.swap.swapStats')
      .sort({ 'rating.average': -1, views: -1 })
      .limit(5);

      recommendations.push(...categoryOffers);
    }

    // Get offers from users with high ratings
    const topRatedOffers = await SwapOffer.find({
      status: 'active',
      isPublic: true,
      user: { $ne: req.user._id },
      'rating.average': { $gte: 4.0 }
    })
    .populate('user', 'firstName lastName email profile.profilePicture profile.swap.swapStats')
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(5);

    recommendations.push(...topRatedOffers);

    // Remove duplicates and limit results
    const uniqueRecommendations = recommendations.filter((offer, index, self) => 
      index === self.findIndex(o => o._id.toString() === offer._id.toString())
    ).slice(0, 10);

    res.json({
      recommendations: uniqueRecommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error fetching recommendations' });
  }
});

// @route   GET /api/swap/transactions
// @desc    Get user's swap transactions
// @access  Private
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      'participants.user': req.user._id
    };

    // Filter by status
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const transactions = await SwapTransaction.find(filters)
      .populate('participants.user', 'firstName lastName email profile.profilePicture')
      .populate('request', 'title description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SwapTransaction.countDocuments(filters);

    res.json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get swap transactions error:', error);
    res.status(500).json({ message: 'Server error fetching swap transactions' });
  }
});

// @route   POST /api/swap/transactions/:id/feedback
// @desc    Submit feedback for a completed transaction
// @access  Private (Participants only)
router.post('/transactions/:id/feedback', [
  body('to').isMongoId().withMessage('Valid user ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be less than 500 characters'),
  body('categories').optional().isArray().withMessage('Categories must be an array')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { to, rating, comment, categories } = req.body;

    const transaction = await SwapTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user is participant
    const participant = transaction.participants.find(p => p.user.toString() === req.user._id.toString());
    if (!participant) {
      return res.status(403).json({ message: 'You can only provide feedback for your own transactions' });
    }

    // Check if feedback already exists
    const existingFeedback = transaction.feedback.find(fb => 
      fb.from.toString() === req.user._id.toString() && fb.to.toString() === to.toString()
    );

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already provided feedback for this user' });
    }

    await transaction.addFeedback(req.user._id, to, rating, comment, categories);

    // Update user's average rating
    const user = await User.findById(to);
    if (user) {
      const totalRating = user.profile.swap.swapStats.averageRating * user.profile.swap.swapStats.totalRatings + rating;
      user.profile.swap.swapStats.totalRatings += 1;
      user.profile.swap.swapStats.averageRating = totalRating / user.profile.swap.swapStats.totalRatings;
      await user.save();
    }

    res.json({
      message: 'Feedback submitted successfully',
      transaction
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// @route   PUT /api/swap/profile
// @desc    Update user's swap profile
// @access  Private
router.put('/profile', [
  body('isAvailableForSwaps').optional().isBoolean(),
  body('swapBio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('swapPreferences.preferredCategories').optional().isArray(),
  body('swapPreferences.maxDistance').optional().isInt({ min: 1, max: 1000 }),
  body('swapPreferences.preferredCommunication').optional().isIn(['email', 'phone', 'video-call', 'in-person', 'mixed'])
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const swapUpdates = {};

    // Map request body to swap profile fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        swapUpdates[`profile.swap.${key}`] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: swapUpdates },
      { new: true }
    ).select('firstName lastName email profile.swap');

    res.json({
      message: 'Swap profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update swap profile error:', error);
    res.status(500).json({ message: 'Server error updating swap profile' });
  }
});

module.exports = router;
