const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    maxlength: 1000
  },
  responseMessage: {
    type: String,
    maxlength: 1000
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  expectedDuration: {
    type: String,
    enum: ['1-3 months', '3-6 months', '6-12 months', '1+ years', 'ongoing'],
    default: '3-6 months'
  },
  meetingFrequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'as-needed'],
    default: 'monthly'
  },
  communicationMethod: {
    type: String,
    enum: ['email', 'phone', 'video-call', 'in-person', 'mixed'],
    default: 'mixed'
  },
  goals: [{
    type: String,
    maxlength: 200
  }],
  focusAreas: [{
    type: String,
    enum: ['career-guidance', 'skill-development', 'networking', 'industry-insights', 'resume-review', 'interview-prep', 'entrepreneurship', 'leadership', 'work-life-balance', 'other']
  }],
  sessions: [{
    date: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    type: {
      type: String,
      enum: ['video-call', 'phone', 'in-person', 'email'],
      required: true
    },
    notes: {
      type: String,
      maxlength: 2000
    },
    menteeFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      }
    },
    mentorFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        maxlength: 500
      }
    }
  }],
  overallRating: {
    menteeRating: {
      type: Number,
      min: 1,
      max: 5
    },
    mentorRating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  finalFeedback: {
    menteeFeedback: {
      type: String,
      maxlength: 1000
    },
    mentorFeedback: {
      type: String,
      maxlength: 1000
    }
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
mentorshipSchema.index({ mentor: 1, status: 1 });
mentorshipSchema.index({ mentee: 1, status: 1 });
mentorshipSchema.index({ status: 1 });
mentorshipSchema.index({ createdAt: -1 });

// Virtual for session count
mentorshipSchema.virtual('sessionCount').get(function() {
  return this.sessions.length;
});

// Virtual for total duration
mentorshipSchema.virtual('totalDuration').get(function() {
  return this.sessions.reduce((total, session) => total + session.duration, 0);
});

// Check if mentorship is active
mentorshipSchema.methods.isActive = function() {
  return this.status === 'active' && this.active;
};

// Add a session
mentorshipSchema.methods.addSession = function(sessionData) {
  if (this.status !== 'active') {
    throw new Error('Cannot add session to inactive mentorship');
  }
  
  this.sessions.push(sessionData);
  return this.save();
};

// Complete mentorship
mentorshipSchema.methods.complete = function() {
  this.status = 'completed';
  this.endDate = new Date();
  return this.save();
};

module.exports = mongoose.model('Mentorship', mentorshipSchema);
