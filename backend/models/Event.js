const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
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
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['networking', 'reunion', 'workshop', 'seminar', 'social', 'fundraising', 'other'],
    default: 'networking'
  },
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  time: {
    start: String,
    end: String
  },
  location: {
    venue: {
      type: String,
      required: true,
      maxlength: 200
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    isVirtual: {
      type: Boolean,
      default: false
    },
    virtualLink: String
  },
  capacity: {
    type: Number,
    min: 1,
    default: 100
  },
  registrationDeadline: {
    type: Date
  },
  registrationFee: {
    type: Number,
    min: 0,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  targetAudience: {
    graduationYears: [Number],
    degrees: [String],
    locations: [String]
  },
  requirements: {
    minAge: Number,
    maxAge: Number,
    dressCode: String,
    other: String
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
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  registrations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'cancelled', 'attended'],
      default: 'registered'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    notes: String
  }],
  tags: [String],
  isFeatured: {
    type: Boolean,
    default: false
  },
  maxRegistrations: {
    type: Number,
    default: 100
  }
}, {
  timestamps: true
});

// Index for better query performance
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ 'location.city': 1 });
eventSchema.index({ isPublic: 1, status: 1 });
eventSchema.index({ tags: 1 });

// Virtual for registration count
eventSchema.virtual('registrationCount').get(function() {
  return this.registrations.filter(reg => reg.status === 'registered').length;
});

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.maxRegistrations - this.registrationCount);
});

// Check if user is registered
eventSchema.methods.isUserRegistered = function(userId) {
  return this.registrations.some(reg => 
    reg.user.toString() === userId.toString() && reg.status === 'registered'
  );
};

// Register user for event
eventSchema.methods.registerUser = function(userId, notes = '') {
  if (this.isUserRegistered(userId)) {
    throw new Error('User already registered for this event');
  }
  
  if (this.availableSpots <= 0) {
    throw new Error('Event is full');
  }
  
  if (this.registrationDeadline && new Date() > this.registrationDeadline) {
    throw new Error('Registration deadline has passed');
  }
  
  this.registrations.push({
    user: userId,
    notes
  });
  
  return this.save();
};

// Cancel user registration
eventSchema.methods.cancelRegistration = function(userId) {
  const registration = this.registrations.find(reg => 
    reg.user.toString() === userId.toString() && reg.status === 'registered'
  );
  
  if (!registration) {
    throw new Error('User is not registered for this event');
  }
  
  registration.status = 'cancelled';
  return this.save();
};

module.exports = mongoose.model('Event', eventSchema);
