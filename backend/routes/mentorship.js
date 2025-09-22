const express = require('express');
const { body, validationResult } = require('express-validator');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/mentorship/mentors
// @desc    Get available mentors with filtering
// @access  Private
router.get('/mentors', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filters = {
      role: { $in: ['alumni', 'admin', 'super_admin'] },
      'profile.mentorship.isAvailableAsMentor': true,
      status: 'active'
    };

    // Filter by specialties
    if (req.query.specialties) {
      const specialties = Array.isArray(req.query.specialties) 
        ? req.query.specialties 
        : [req.query.specialties];
      filters['profile.mentorship.mentorSpecialties'] = { $in: specialties };
    }

    // Filter by experience level
    if (req.query.experience) {
      filters['profile.mentorship.mentorExperience'] = req.query.experience;
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

    // Search by name or bio
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filters.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { 'profile.mentorship.mentorBio': searchRegex },
        { 'profile.skills': { $in: [searchRegex] } }
      ];
    }

    const mentors = await User.find(filters)
      .select('firstName lastName email profile.mentorship profile.skills profile.location profile.profilePicture')
      .sort({ 'profile.mentorship.mentorRating': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filters);

    res.json({
      mentors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMentors: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({ message: 'Server error fetching mentors' });
  }
});

// @route   GET /api/mentorship/mentor/:id
// @desc    Get mentor profile details
// @access  Private
router.get('/mentor/:id', authenticateToken, async (req, res) => {
  try {
    const mentor = await User.findById(req.params.id)
      .select('firstName lastName email profile.mentorship profile.skills profile.location profile.profilePicture profile.bio profile.currentJob profile.company');

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (!mentor.profile.mentorship.isAvailableAsMentor) {
      return res.status(400).json({ message: 'This user is not available as a mentor' });
    }

    // Get mentor's mentorship statistics
    const mentorshipStats = await Mentorship.aggregate([
      { $match: { mentor: mentor._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalMentees: { $sum: 1 },
          averageRating: { $avg: '$overallRating.menteeRating' },
          totalSessions: { $sum: { $size: '$sessions' } }
        }
      }
    ]);

    const stats = mentorshipStats[0] || {
      totalMentees: 0,
      averageRating: 0,
      totalSessions: 0
    };

    res.json({
      mentor,
      stats
    });
  } catch (error) {
    console.error('Get mentor error:', error);
    res.status(500).json({ message: 'Server error fetching mentor' });
  }
});

// @route   POST /api/mentorship/request
// @desc    Send mentorship request
// @access  Private (Students only)
router.post('/request', [
  body('mentorId').isMongoId().withMessage('Valid mentor ID is required'),
  body('requestMessage').optional().trim().isLength({ max: 1000 }).withMessage('Request message must be less than 1000 characters'),
  body('expectedDuration').optional().isIn(['1-3 months', '3-6 months', '6-12 months', '1+ years', 'ongoing']),
  body('meetingFrequency').optional().isIn(['weekly', 'bi-weekly', 'monthly', 'as-needed']),
  body('communicationMethod').optional().isIn(['email', 'phone', 'video-call', 'in-person', 'mixed']),
  body('goals').optional().isArray(),
  body('focusAreas').optional().isArray()
], authenticateToken, requireRole('student'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mentorId, requestMessage, expectedDuration, meetingFrequency, communicationMethod, goals, focusAreas } = req.body;

    // Check if mentor exists and is available
    const mentor = await User.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (!mentor.profile.mentorship.isAvailableAsMentor) {
      return res.status(400).json({ message: 'This mentor is not currently available' });
    }

    if (mentor.profile.mentorship.currentMentees >= mentor.profile.mentorship.maxMentees) {
      return res.status(400).json({ message: 'This mentor has reached their maximum number of mentees' });
    }

    // Check if there's already a pending or active mentorship
    const existingMentorship = await Mentorship.findOne({
      mentor: mentorId,
      mentee: req.user._id,
      status: { $in: ['pending', 'accepted', 'active'] }
    });

    if (existingMentorship) {
      return res.status(400).json({ message: 'You already have a mentorship request or active mentorship with this mentor' });
    }

    // Create mentorship request
    const mentorship = new Mentorship({
      mentor: mentorId,
      mentee: req.user._id,
      requestMessage,
      expectedDuration,
      meetingFrequency,
      communicationMethod,
      goals,
      focusAreas
    });

    await mentorship.save();
    await mentorship.populate('mentor', 'firstName lastName email profile.profilePicture');

    res.status(201).json({
      message: 'Mentorship request sent successfully',
      mentorship
    });
  } catch (error) {
    console.error('Create mentorship request error:', error);
    res.status(500).json({ message: 'Server error creating mentorship request' });
  }
});

// @route   GET /api/mentorship/requests
// @desc    Get mentorship requests (for mentors)
// @access  Private (Alumni, Admin, Super Admin)
router.get('/requests', authenticateToken, requireRole('alumni', 'admin', 'super_admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = { mentor: req.user._id };

    // Filter by status
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const requests = await Mentorship.find(filters)
      .populate('mentee', 'firstName lastName email profile.profilePicture profile.graduationYear profile.degree profile.major')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments(filters);

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
    console.error('Get mentorship requests error:', error);
    res.status(500).json({ message: 'Server error fetching mentorship requests' });
  }
});

// @route   PUT /api/mentorship/request/:id/respond
// @desc    Respond to mentorship request
// @access  Private (Alumni, Admin, Super Admin)
router.put('/request/:id/respond', [
  body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected'),
  body('responseMessage').optional().trim().isLength({ max: 1000 }).withMessage('Response message must be less than 1000 characters')
], authenticateToken, requireRole('alumni', 'admin', 'super_admin'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, responseMessage } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship request not found' });
    }

    if (mentorship.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only respond to your own mentorship requests' });
    }

    if (mentorship.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been responded to' });
    }

    mentorship.status = status;
    mentorship.responseMessage = responseMessage;

    if (status === 'accepted') {
      mentorship.startDate = new Date();
      mentorship.status = 'active';
      
      // Update mentor's current mentees count
      await User.findByIdAndUpdate(mentorship.mentor, {
        $inc: { 'profile.mentorship.currentMentees': 1 }
      });
    }

    await mentorship.save();
    await mentorship.populate('mentee', 'firstName lastName email profile.profilePicture');

    res.json({
      message: `Mentorship request ${status} successfully`,
      mentorship
    });
  } catch (error) {
    console.error('Respond to mentorship request error:', error);
    res.status(500).json({ message: 'Server error responding to mentorship request' });
  }
});

// @route   GET /api/mentorship/my-mentorships
// @desc    Get user's mentorships (as mentee or mentor)
// @access  Private
router.get('/my-mentorships', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      $or: [
        { mentee: req.user._id },
        { mentor: req.user._id }
      ]
    };

    // Filter by status
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const mentorships = await Mentorship.find(filters)
      .populate('mentor', 'firstName lastName email profile.profilePicture profile.mentorship.mentorSpecialties')
      .populate('mentee', 'firstName lastName email profile.profilePicture profile.graduationYear profile.degree')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments(filters);

    res.json({
      mentorships,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMentorships: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get my mentorships error:', error);
    res.status(500).json({ message: 'Server error fetching mentorships' });
  }
});

// @route   PUT /api/mentorship/:id/complete
// @desc    Complete a mentorship
// @access  Private
router.put('/:id/complete', [
  body('finalFeedback').optional().trim().isLength({ max: 1000 }).withMessage('Final feedback must be less than 1000 characters'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { finalFeedback, rating } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    if (mentorship.mentee.toString() !== req.user._id.toString() && 
        mentorship.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only complete your own mentorships' });
    }

    if (mentorship.status !== 'active') {
      return res.status(400).json({ message: 'Only active mentorships can be completed' });
    }

    // Update final feedback and rating
    if (mentorship.mentee.toString() === req.user._id.toString()) {
      mentorship.finalFeedback.menteeFeedback = finalFeedback;
      mentorship.overallRating.menteeRating = rating;
    } else {
      mentorship.finalFeedback.mentorFeedback = finalFeedback;
      mentorship.overallRating.mentorRating = rating;
    }

    // Complete the mentorship
    await mentorship.complete();

    // Update mentor's current mentees count
    await User.findByIdAndUpdate(mentorship.mentor, {
      $inc: { 'profile.mentorship.currentMentees': -1 }
    });

    // Update mentor's total sessions and rating
    if (rating) {
      const mentor = await User.findById(mentorship.mentor);
      const totalSessions = mentor.profile.mentorship.totalMentorshipSessions + mentorship.sessions.length;
      const currentRating = mentor.profile.mentorship.mentorRating;
      const newRating = ((currentRating * (totalSessions - mentorship.sessions.length)) + rating) / totalSessions;
      
      await User.findByIdAndUpdate(mentorship.mentor, {
        'profile.mentorship.totalMentorshipSessions': totalSessions,
        'profile.mentorship.mentorRating': newRating
      });
    }

    res.json({
      message: 'Mentorship completed successfully',
      mentorship
    });
  } catch (error) {
    console.error('Complete mentorship error:', error);
    res.status(500).json({ message: 'Server error completing mentorship' });
  }
});

// @route   POST /api/mentorship/:id/session
// @desc    Add a mentorship session
// @access  Private
router.post('/:id/session', [
  body('date').isISO8601().withMessage('Valid session date is required'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('type').isIn(['video-call', 'phone', 'in-person', 'email']).withMessage('Valid session type is required'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes must be less than 2000 characters')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, duration, type, notes } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if user is part of this mentorship
    if (mentorship.mentee.toString() !== req.user._id.toString() && 
        mentorship.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only add sessions to your own mentorships' });
    }

    if (mentorship.status !== 'active') {
      return res.status(400).json({ message: 'Sessions can only be added to active mentorships' });
    }

    const sessionData = {
      date: new Date(date),
      duration,
      type,
      notes
    };

    await mentorship.addSession(sessionData);

    res.json({
      message: 'Session added successfully',
      session: sessionData
    });
  } catch (error) {
    console.error('Add session error:', error);
    res.status(500).json({ message: 'Server error adding session' });
  }
});

// @route   PUT /api/mentorship/profile
// @desc    Update mentorship profile (for mentors)
// @access  Private (Alumni, Admin, Super Admin)
router.put('/profile', [
  body('isAvailableAsMentor').optional().isBoolean(),
  body('mentorBio').optional().trim().isLength({ max: 500 }).withMessage('Mentor bio must be less than 500 characters'),
  body('mentorSpecialties').optional().isArray(),
  body('mentorExperience').optional().isIn(['0-2 years', '2-5 years', '5-10 years', '10+ years']),
  body('maxMentees').optional().isInt({ min: 1, max: 10 }),
  body('preferredMeetingFrequency').optional().isIn(['weekly', 'bi-weekly', 'monthly', 'as-needed']),
  body('preferredCommunicationMethod').optional().isIn(['email', 'phone', 'video-call', 'in-person', 'mixed'])
], authenticateToken, requireRole('alumni', 'admin', 'super_admin'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const mentorshipUpdates = {};

    // Map request body to mentorship profile fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        mentorshipUpdates[`profile.mentorship.${key}`] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: mentorshipUpdates },
      { new: true }
    ).select('firstName lastName email profile.mentorship');

    res.json({
      message: 'Mentorship profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update mentorship profile error:', error);
    res.status(500).json({ message: 'Server error updating mentorship profile' });
  }
});

module.exports = router;
