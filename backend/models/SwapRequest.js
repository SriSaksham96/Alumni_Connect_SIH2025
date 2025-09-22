const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offerOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SwapOffer',
    required: true
  },
  // What the requester is offering in return
  offerInReturn: {
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    category: {
      type: String,
      enum: ['skill', 'service', 'accommodation', 'item', 'other'],
      required: true
    },
    estimatedValue: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    duration: {
      type: String,
      maxlength: 100
    },
    availability: {
      startDate: Date,
      endDate: Date,
      timeSlots: [{
        day: String,
        startTime: String,
        endTime: String
      }]
    }
  },
  // Request details
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  proposedTerms: {
    type: String,
    maxlength: 1000
  },
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'negotiating', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  // Timeline
  timeline: {
    proposedStartDate: Date,
    proposedEndDate: Date,
    actualStartDate: Date,
    actualEndDate: Date,
    duration: Number // in days or hours
  },
  // Communication
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  // Negotiation history
  negotiations: [{
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changes: {
      type: String,
      required: true,
      maxlength: 1000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['proposed', 'accepted', 'rejected'],
      default: 'proposed'
    }
  }],
  // Completion and feedback
  completion: {
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date,
    completionNotes: String,
    feedback: {
      requesterToOwner: {
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        comment: {
          type: String,
          maxlength: 500
        },
        submittedAt: Date
      },
      ownerToRequester: {
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        comment: {
          type: String,
          maxlength: 500
        },
        submittedAt: Date
      }
    }
  },
  // Dispute resolution
  dispute: {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['non_completion', 'poor_quality', 'misrepresentation', 'payment_issue', 'other']
    },
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
  isUrgent: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [String],
  // For accommodation swaps
  accommodationDetails: {
    checkInDate: Date,
    checkOutDate: Date,
    numberOfGuests: Number,
    specialRequests: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
swapRequestSchema.index({ requester: 1, status: 1 });
swapRequestSchema.index({ offerOwner: 1, status: 1 });
swapRequestSchema.index({ offer: 1, status: 1 });
swapRequestSchema.index({ status: 1, createdAt: -1 });
swapRequestSchema.index({ 'timeline.proposedStartDate': 1 });
swapRequestSchema.index({ 'dispute.status': 1 });

// Virtual for request age
swapRequestSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for completion status
swapRequestSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for has feedback
swapRequestSchema.virtual('hasFeedback').get(function() {
  return this.completion.feedback.requesterToOwner.rating || this.completion.feedback.ownerToRequester.rating;
});

// Method to add message
swapRequestSchema.methods.addMessage = function(senderId, message) {
  this.messages.push({
    sender: senderId,
    message: message,
    timestamp: new Date()
  });
  return this.save();
};

// Method to mark messages as read
swapRequestSchema.methods.markMessagesAsRead = function(userId) {
  this.messages.forEach(msg => {
    if (msg.sender.toString() !== userId.toString()) {
      msg.isRead = true;
    }
  });
  return this.save();
};

// Method to get unread message count
swapRequestSchema.methods.getUnreadCount = function(userId) {
  return this.messages.filter(msg => 
    msg.sender.toString() !== userId.toString() && !msg.isRead
  ).length;
};

// Method to add negotiation
swapRequestSchema.methods.addNegotiation = function(proposedBy, changes) {
  this.negotiations.push({
    proposedBy: proposedBy,
    changes: changes,
    timestamp: new Date()
  });
  return this.save();
};

// Method to complete swap
swapRequestSchema.methods.complete = function(completedBy, notes) {
  this.status = 'completed';
  this.completion.completedBy = completedBy;
  this.completion.completedAt = new Date();
  this.completion.completionNotes = notes;
  return this.save();
};

// Method to raise dispute
swapRequestSchema.methods.raiseDispute = function(raisedBy, reason, description) {
  this.dispute.raisedBy = raisedBy;
  this.dispute.reason = reason;
  this.dispute.description = description;
  this.dispute.raisedAt = new Date();
  this.status = 'disputed';
  return this.save();
};

// Pre-save middleware to validate dates
swapRequestSchema.pre('save', function(next) {
  if (this.timeline.proposedStartDate && this.timeline.proposedEndDate) {
    if (this.timeline.proposedStartDate >= this.timeline.proposedEndDate) {
      return next(new Error('Proposed start date must be before end date'));
    }
  }
  
  if (this.accommodationDetails.checkInDate && this.accommodationDetails.checkOutDate) {
    if (this.accommodationDetails.checkInDate >= this.accommodationDetails.checkOutDate) {
      return next(new Error('Check-in date must be before check-out date'));
    }
  }
  
  next();
});

module.exports = mongoose.model('SwapRequest', swapRequestSchema);
