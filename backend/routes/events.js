const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requirePermission, requireRole, optionalAuth } = require('../middleware/auth');
const { uploadEventImages, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events with filtering and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      status: 'published',
      isPublic: true
    };

    // Filter by event type
    if (req.query.eventType) {
      filters.eventType = req.query.eventType;
    }

    // Filter by date range
    if (req.query.startDate) {
      filters.date = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      filters.date = { ...filters.date, $lte: new Date(req.query.endDate) };
    }

    // Filter by location
    if (req.query.location) {
      const locationRegex = new RegExp(req.query.location, 'i');
      filters.$or = [
        { 'location.venue': locationRegex },
        { 'location.address.city': locationRegex },
        { 'location.address.state': locationRegex }
      ];
    }

    // Filter by graduation year
    if (req.query.graduationYear) {
      filters['targetAudience.graduationYears'] = parseInt(req.query.graduationYear);
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
      .populate('organizer', 'firstName lastName profile.profilePicture')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(filters);

    // Add registration status for authenticated users
    if (req.user) {
      events.forEach(event => {
        event.isRegistered = event.isUserRegistered(req.user._id);
      });
    }

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
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName profile.profilePicture email')
      .populate('registrations.user', 'firstName lastName profile.profilePicture');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can view this event
    if (!event.isPublic && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Event is not public' });
    }

    // Add registration status for authenticated users
    if (req.user) {
      event.isRegistered = event.isUserRegistered(req.user._id);
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error fetching event' });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Alumni, Admin, Super Admin)
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Event title is required'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Event description is required'),
  body('date').isISO8601().withMessage('Valid event date is required'),
  body('location.venue').trim().isLength({ min: 1, max: 200 }).withMessage('Venue is required'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
], authenticateToken, requirePermission('create_events'), uploadEventImages, handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const eventData = req.body;
    eventData.organizer = req.user._id;

    // Handle image uploads
    if (req.files && req.files.eventImages) {
      eventData.images = req.files.eventImages.map(file => ({
        url: `/uploads/events/${file.filename}`,
        caption: file.originalname,
        isPrimary: false
      }));
    }

    const event = new Event(eventData);
    await event.save();

    await event.populate('organizer', 'firstName lastName profile.profilePicture');

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error creating event' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Admin only)
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ min: 1, max: 2000 }),
  body('date').optional().isISO8601(),
  body('capacity').optional().isInt({ min: 1 })
], authenticateToken, requirePermission('edit_events'), uploadEventImages, handleUploadError, async (req, res) => {
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

    // Handle image uploads
    if (req.files && req.files.eventImages) {
      const newImages = req.files.eventImages.map(file => ({
        url: `/uploads/events/${file.filename}`,
        caption: file.originalname,
        isPrimary: false
      }));
      updates.images = [...(event.images || []), ...newImages];
    }

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
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error updating event' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Admin, Super Admin)
router.delete('/:id', authenticateToken, requirePermission('delete_events'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error deleting event' });
  }
});

// @route   POST /api/events/:id/register
// @desc    Register for event
// @access  Private
router.post('/:id/register', [
  body('notes').optional().trim().isLength({ max: 500 })
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not available for registration' });
    }

    if (!event.isPublic) {
      return res.status(403).json({ message: 'Event is not public' });
    }

    try {
      await event.registerUser(req.user._id, req.body.notes);
      
      res.json({
        message: 'Successfully registered for event',
        registrationCount: event.registrationCount,
        availableSpots: event.availableSpots
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Server error registering for event' });
  }
});

// @route   DELETE /api/events/:id/register
// @desc    Cancel event registration
// @access  Private
router.delete('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    try {
      await event.cancelRegistration(req.user._id);
      
      res.json({
        message: 'Registration cancelled successfully',
        registrationCount: event.registrationCount,
        availableSpots: event.availableSpots
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Server error cancelling registration' });
  }
});

// @route   GET /api/events/user/registered
// @desc    Get user's registered events
// @access  Private
router.get('/user/registered', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const events = await Event.find({
      'registrations.user': req.user._id,
      'registrations.status': 'registered'
    })
    .populate('organizer', 'firstName lastName profile.profilePicture')
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit);

    const total = await Event.countDocuments({
      'registrations.user': req.user._id,
      'registrations.status': 'registered'
    });

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
    console.error('Get user events error:', error);
    res.status(500).json({ message: 'Server error fetching user events' });
  }
});

module.exports = router;
