const mongoose = require('mongoose');

const swapOfferSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  category: {
    type: String,
    enum: ['skill', 'service', 'accommodation', 'item', 'other'],
    required: true
  },
  subcategory: {
    type: String,
    required: true,
    maxlength: 100
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: function() {
        return this.category === 'accommodation' || this.locationRequired;
      }
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  locationRequired: {
    type: Boolean,
    default: false
  },
  availability: {
    startDate: Date,
    endDate: Date,
    timeSlots: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // HH:MM format
      endTime: String,   // HH:MM format
      timezone: String
    }],
    isRecurring: {
      type: Boolean,
      default: false
    }
  },
  // For accommodation swaps
  accommodation: {
    propertyType: {
      type: String,
      enum: ['apartment', 'house', 'condo', 'studio', 'room', 'other']
    },
    bedrooms: Number,
    bathrooms: Number,
    maxGuests: Number,
    amenities: [String],
    photos: [String],
    houseRules: [String],
    checkInTime: String,
    checkOutTime: String,
    minimumStay: Number, // in days
    maximumStay: Number, // in days
    smokingAllowed: {
      type: Boolean,
      default: false
    },
    petsAllowed: {
      type: Boolean,
      default: false
    }
  },
  // What the user wants in return
  wantsInReturn: {
    type: String,
    required: true,
    maxlength: 1000
  },
  preferredCategories: [{
    type: String,
    enum: ['skill', 'service', 'accommodation', 'item', 'other']
  }],
  estimatedValue: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    isFlexible: {
      type: Boolean,
      default: true
    }
  },
  // For skill/service swaps
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  experience: {
    type: String,
    maxlength: 500
  },
  portfolio: [{
    title: String,
    description: String,
    url: String,
    image: String
  }],
  // Status and visibility
  status: {
    type: String,
    enum: ['active', 'inactive', 'paused', 'completed'],
    default: 'active'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  requests: {
    type: Number,
    default: 0
  },
  // Rating and feedback
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: String,
    url: String,
    verifiedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
swapOfferSchema.index({ user: 1, status: 1 });
swapOfferSchema.index({ category: 1, status: 1 });
swapOfferSchema.index({ subcategory: 1, status: 1 });
swapOfferSchema.index({ tags: 1, status: 1 });
swapOfferSchema.index({ 'location.coordinates': '2dsphere' });
swapOfferSchema.index({ createdAt: -1 });
swapOfferSchema.index({ rating: -1 });
swapOfferSchema.index({ views: -1 });

// Text search index
swapOfferSchema.index({
  title: 'text',
  description: 'text',
  subcategory: 'text',
  tags: 'text'
});

// Virtual for availability status
swapOfferSchema.virtual('isAvailable').get(function() {
  if (this.status !== 'active') return false;
  
  if (this.availability.startDate && this.availability.endDate) {
    const now = new Date();
    return now >= this.availability.startDate && now <= this.availability.endDate;
  }
  
  return true;
});

// Method to increment views
swapOfferSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment requests
swapOfferSchema.methods.incrementRequests = function() {
  this.requests += 1;
  return this.save();
};

// Method to update rating
swapOfferSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Pre-save middleware to validate accommodation data
swapOfferSchema.pre('save', function(next) {
  if (this.category === 'accommodation') {
    if (!this.accommodation.propertyType) {
      return next(new Error('Property type is required for accommodation offers'));
    }
    if (!this.accommodation.maxGuests || this.accommodation.maxGuests < 1) {
      return next(new Error('Maximum guests must be at least 1 for accommodation offers'));
    }
  }
  next();
});

module.exports = mongoose.model('SwapOffer', swapOfferSchema);
