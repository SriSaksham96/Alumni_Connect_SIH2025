const express = require('express');
const { body, validationResult } = require('express-validator');
const News = require('../models/News');
const User = require('../models/User');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { uploadNewsImages, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/news
// @desc    Get all news with filtering and pagination
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

    // Filter by category
    if (req.query.category) {
      filters.category = req.query.category;
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      filters.tags = { $in: tags };
    }

    // Filter by date range
    if (req.query.startDate) {
      filters.publishDate = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      filters.publishDate = { ...filters.publishDate, $lte: new Date(req.query.endDate) };
    }

    // Filter by graduation year
    if (req.query.graduationYear) {
      filters['targetAudience.graduationYears'] = parseInt(req.query.graduationYear);
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

    // Show featured news first
    const sortOrder = req.query.featured === 'true' ? 
      { isFeatured: -1, publishDate: -1 } : 
      { publishDate: -1 };

    const news = await News.find(filters)
      .populate('author', 'firstName lastName profile.profilePicture')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments(filters);

    // Add like status for authenticated users
    if (req.user) {
      news.forEach(article => {
        article.isLiked = article.hasUserLiked(req.user._id);
      });
    }

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
    console.error('Get news error:', error);
    res.status(500).json({ message: 'Server error fetching news' });
  }
});

// @route   GET /api/news/:id
// @desc    Get news article by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const article = await News.findById(req.params.id)
      .populate('author', 'firstName lastName profile.profilePicture')
      .populate('likes.user', 'firstName lastName')
      .populate('comments.user', 'firstName lastName profile.profilePicture')
      .populate('comments.replies.user', 'firstName lastName profile.profilePicture');

    if (!article) {
      return res.status(404).json({ message: 'News article not found' });
    }

    // Check if user can view this article
    if (!article.isPublic && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Article is not public' });
    }

    // Increment view count
    await article.incrementViews();

    // Add like status for authenticated users
    if (req.user) {
      article.isLiked = article.hasUserLiked(req.user._id);
    }

    res.json(article);
  } catch (error) {
    console.error('Get news article error:', error);
    res.status(500).json({ message: 'Server error fetching news article' });
  }
});

// @route   POST /api/news
// @desc    Create new news article
// @access  Private (Admin only)
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Article title is required'),
  body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Article content is required'),
  body('category').optional().isIn(['general', 'alumni', 'events', 'achievements', 'fundraising', 'academic', 'sports', 'other']),
  body('excerpt').optional().trim().isLength({ max: 500 })
], authenticateToken, requireAdmin, uploadNewsImages, handleUploadError, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const articleData = req.body;
    articleData.author = req.user._id;

    // Handle image uploads
    if (req.files && req.files.newsImages) {
      articleData.images = req.files.newsImages.map(file => ({
        url: `/uploads/news/${file.filename}`,
        caption: file.originalname,
        alt: file.originalname
      }));
    }

    const article = new News(articleData);
    await article.save();

    await article.populate('author', 'firstName lastName profile.profilePicture');

    res.status(201).json({
      message: 'News article created successfully',
      article
    });
  } catch (error) {
    console.error('Create news article error:', error);
    res.status(500).json({ message: 'Server error creating news article' });
  }
});

// @route   PUT /api/news/:id
// @desc    Update news article
// @access  Private (Admin only)
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().trim().isLength({ min: 1, max: 10000 }),
  body('category').optional().isIn(['general', 'alumni', 'events', 'achievements', 'fundraising', 'academic', 'sports', 'other'])
], authenticateToken, requireAdmin, uploadNewsImages, handleUploadError, async (req, res) => {
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

    // Handle image uploads
    if (req.files && req.files.newsImages) {
      const newImages = req.files.newsImages.map(file => ({
        url: `/uploads/news/${file.filename}`,
        caption: file.originalname,
        alt: file.originalname
      }));
      updates.images = [...(article.images || []), ...newImages];
    }

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
    console.error('Update news article error:', error);
    res.status(500).json({ message: 'Server error updating news article' });
  }
});

// @route   DELETE /api/news/:id
// @desc    Delete news article
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const article = await News.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'News article not found' });
    }

    await News.findByIdAndDelete(req.params.id);

    res.json({ message: 'News article deleted successfully' });
  } catch (error) {
    console.error('Delete news article error:', error);
    res.status(500).json({ message: 'Server error deleting news article' });
  }
});

// @route   POST /api/news/:id/like
// @desc    Toggle like on news article
// @access  Private
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const article = await News.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'News article not found' });
    }

    const isLiked = article.toggleLike(req.user._id);
    await article.save();

    res.json({
      message: isLiked ? 'Article liked' : 'Article unliked',
      isLiked,
      likeCount: article.likeCount
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error toggling like' });
  }
});

// @route   POST /api/news/:id/comment
// @desc    Add comment to news article
// @access  Private
router.post('/:id/comment', [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment content is required')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const article = await News.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'News article not found' });
    }

    await article.addComment(req.user._id, req.body.content);
    await article.populate('comments.user', 'firstName lastName profile.profilePicture');

    const newComment = article.comments[article.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @route   GET /api/news/categories
// @desc    Get available news categories
// @access  Public
router.get('/categories', (req, res) => {
  const categories = [
    'general',
    'alumni',
    'events',
    'achievements',
    'fundraising',
    'academic',
    'sports',
    'other'
  ];

  res.json({ categories });
});

// @route   GET /api/news/featured
// @desc    Get featured news articles
// @access  Public
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const featuredNews = await News.find({
      status: 'published',
      isPublic: true,
      isFeatured: true
    })
    .populate('author', 'firstName lastName profile.profilePicture')
    .sort({ publishDate: -1 })
    .limit(limit);

    // Add like status for authenticated users
    if (req.user) {
      featuredNews.forEach(article => {
        article.isLiked = article.hasUserLiked(req.user._id);
      });
    }

    res.json({ featuredNews });
  } catch (error) {
    console.error('Get featured news error:', error);
    res.status(500).json({ message: 'Server error fetching featured news' });
  }
});

module.exports = router;
