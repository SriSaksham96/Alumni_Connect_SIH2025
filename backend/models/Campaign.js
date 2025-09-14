const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['scholarship', 'facilities', 'research', 'emergency', 'events', 'general', 'other'],
    default: 'general'
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 1
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  updates: [{
    title: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  milestones: [{
    amount: Number,
    description: String,
    achieved: {
      type: Boolean,
      default: false
    },
    achievedAt: Date
  }],
  tags: [String],
  targetAudience: {
    graduationYears: [Number],
    degrees: [String],
    locations: [String]
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  socialSharing: {
    enabled: {
      type: Boolean,
      default: true
    },
    customMessage: String
  }
}, {
  timestamps: true
});

// Index for better query performance
campaignSchema.index({ status: 1, endDate: 1 });
campaignSchema.index({ organizer: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ isPublic: 1, status: 1 });
campaignSchema.index({ isFeatured: 1, status: 1 });
campaignSchema.index({ tags: 1 });

// Virtual for progress percentage
campaignSchema.virtual('progressPercentage').get(function() {
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

// Virtual for days remaining
campaignSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Virtual for amount remaining
campaignSchema.virtual('amountRemaining').get(function() {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

// Check if campaign is active
campaignSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.startDate <= now && 
         this.endDate >= now &&
         this.currentAmount < this.targetAmount;
};

// Update current amount
campaignSchema.methods.updateAmount = function(amount) {
  this.currentAmount += amount;
  
  // Check milestones
  this.milestones.forEach(milestone => {
    if (!milestone.achieved && this.currentAmount >= milestone.amount) {
      milestone.achieved = true;
      milestone.achievedAt = new Date();
    }
  });
  
  // Check if campaign is completed
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
  }
  
  return this.save();
};

// Add campaign update
campaignSchema.methods.addUpdate = function(title, content, authorId) {
  this.updates.push({
    title,
    content,
    author: authorId
  });
  return this.save();
};

module.exports = mongoose.model('Campaign', campaignSchema);
