const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  purpose: {
    type: String,
    enum: ['general', 'scholarship', 'facilities', 'research', 'events', 'emergency', 'other'],
    default: 'general'
  },
  description: {
    type: String,
    maxlength: 500
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'check', 'cash', 'other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paypal', 'square', 'other']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly']
    },
    nextPaymentDate: Date,
    endDate: Date,
    totalPayments: Number,
    completedPayments: {
      type: Number,
      default: 0
    }
  },
  receipt: {
    number: String,
    sentAt: Date,
    method: {
      type: String,
      enum: ['email', 'mail', 'download']
    }
  },
  taxDeductible: {
    type: Boolean,
    default: true
  },
  taxReceipt: {
    issued: Boolean,
    issuedAt: Date,
    number: String
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date
}, {
  timestamps: true
});

// Index for better query performance
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });
donationSchema.index({ campaign: 1 });
donationSchema.index({ purpose: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ isAnonymous: 1 });

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Static method to get donation statistics
donationSchema.statics.getStats = async function(filters = {}) {
  const pipeline = [
    { $match: { paymentStatus: 'completed', ...filters } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        minAmount: { $min: '$amount' },
        maxAmount: { $max: '$amount' }
      }
    }
  ];
  
  const stats = await this.aggregate(pipeline);
  return stats[0] || {
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0,
    minAmount: 0,
    maxAmount: 0
  };
};

// Static method to get donations by time period
donationSchema.statics.getDonationsByPeriod = async function(period = 'month', filters = {}) {
  const dateFormat = period === 'day' ? '%Y-%m-%d' : 
                    period === 'week' ? '%Y-%U' : 
                    period === 'month' ? '%Y-%m' : '%Y';
  
  const pipeline = [
    { $match: { paymentStatus: 'completed', ...filters } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Donation', donationSchema);
