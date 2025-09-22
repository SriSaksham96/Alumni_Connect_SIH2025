const mongoose = require('mongoose');

const swapTransactionSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SwapRequest',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['requester', 'offer_owner'],
      required: true
    },
    offered: {
      title: String,
      description: String,
      category: String,
      estimatedValue: {
        amount: Number,
        currency: String
      }
    },
    received: {
      title: String,
      description: String,
      category: String,
      estimatedValue: {
        amount: Number,
        currency: String
      }
    }
  }],
  // Transaction details
  transactionType: {
    type: String,
    enum: ['skill_swap', 'service_swap', 'accommodation_swap', 'item_swap', 'mixed'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  // Timeline
  timeline: {
    startDate: Date,
    endDate: Date,
    actualStartDate: Date,
    actualEndDate: Date,
    duration: Number // in days or hours
  },
  // Value exchange
  valueExchange: {
    totalValue: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    isBalanced: {
      type: Boolean,
      default: true
    },
    valueDifference: {
      amount: Number,
      currency: String
    }
  },
  // Feedback and ratings
  feedback: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      maxlength: 500
    },
    categories: [{
      category: {
        type: String,
        enum: ['communication', 'quality', 'timeliness', 'value', 'overall']
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      }
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  // Completion details
  completion: {
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completionNotes: String,
    deliverables: [{
      title: String,
      description: String,
      url: String,
      type: String
    }],
    photos: [String],
    documents: [{
      name: String,
      url: String,
      type: String
    }]
  },
  // Dispute information
  dispute: {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    description: String,
    raisedAt: Date,
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'closed'],
      default: 'open'
    },
    resolution: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Additional metadata
  tags: [String],
  notes: String,
  isPublic: {
    type: Boolean,
    default: true
  },
  // For accommodation swaps
  accommodationDetails: {
    property: {
      address: String,
      type: String,
      amenities: [String]
    },
    guestDetails: {
      numberOfGuests: Number,
      specialRequests: String
    },
    checkInOut: {
      checkInDate: Date,
      checkOutDate: Date,
      checkInTime: String,
      checkOutTime: String
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
swapTransactionSchema.index({ participants: 1, status: 1 });
swapTransactionSchema.index({ transactionType: 1, status: 1 });
swapTransactionSchema.index({ 'timeline.startDate': 1 });
swapTransactionSchema.index({ 'timeline.endDate': 1 });
swapTransactionSchema.index({ createdAt: -1 });
swapTransactionSchema.index({ 'feedback.rating': -1 });

// Virtual for transaction duration
swapTransactionSchema.virtual('duration').get(function() {
  if (this.timeline.actualStartDate && this.timeline.actualEndDate) {
    return Math.ceil((this.timeline.actualEndDate - this.timeline.actualStartDate) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for average rating
swapTransactionSchema.virtual('averageRating').get(function() {
  if (this.feedback.length === 0) return 0;
  
  const totalRating = this.feedback.reduce((sum, fb) => sum + fb.rating, 0);
  return totalRating / this.feedback.length;
});

// Virtual for completion status
swapTransactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Method to add feedback
swapTransactionSchema.methods.addFeedback = function(from, to, rating, comment, categories) {
  this.feedback.push({
    from: from,
    to: to,
    rating: rating,
    comment: comment,
    categories: categories || [],
    submittedAt: new Date()
  });
  return this.save();
};

// Method to complete transaction
swapTransactionSchema.methods.complete = function(completedBy, notes, deliverables) {
  this.status = 'completed';
  this.completion.completedAt = new Date();
  this.completion.completedBy = completedBy;
  this.completion.completionNotes = notes;
  this.completion.deliverables = deliverables || [];
  return this.save();
};

// Method to raise dispute
swapTransactionSchema.methods.raiseDispute = function(raisedBy, reason, description) {
  this.dispute.raisedBy = raisedBy;
  this.dispute.reason = reason;
  this.dispute.description = description;
  this.dispute.raisedAt = new Date();
  this.status = 'disputed';
  return this.save();
};

// Method to get participant by role
swapTransactionSchema.methods.getParticipantByRole = function(role) {
  return this.participants.find(p => p.role === role);
};

// Method to get feedback between two users
swapTransactionSchema.methods.getFeedbackBetween = function(user1, user2) {
  return this.feedback.filter(fb => 
    (fb.from.toString() === user1.toString() && fb.to.toString() === user2.toString()) ||
    (fb.from.toString() === user2.toString() && fb.to.toString() === user1.toString())
  );
};

// Pre-save middleware to calculate value exchange
swapTransactionSchema.pre('save', function(next) {
  if (this.participants.length === 2) {
    const participant1 = this.participants[0];
    const participant2 = this.participants[1];
    
    const value1 = participant1.offered.estimatedValue.amount || 0;
    const value2 = participant2.offered.estimatedValue.amount || 0;
    
    this.valueExchange.totalValue.amount = value1 + value2;
    this.valueExchange.valueDifference.amount = Math.abs(value1 - value2);
    this.valueExchange.isBalanced = this.valueExchange.valueDifference.amount <= (this.valueExchange.totalValue.amount * 0.2); // 20% tolerance
  }
  next();
});

module.exports = mongoose.model('SwapTransaction', swapTransactionSchema);
