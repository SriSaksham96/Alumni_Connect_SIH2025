const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Only required if not using Google OAuth
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['student', 'alumni', 'admin', 'super_admin'],
    default: 'student'
  },
  permissions: [{
    type: String,
    enum: [
      'read_profile',
      'edit_profile',
      'view_alumni',
      'send_messages',
      'create_events',
      'edit_events',
      'delete_events',
      'create_news',
      'edit_news',
      'delete_news',
      'create_campaigns',
      'manage_users',
      'manage_roles',
      'view_analytics',
      'manage_donations',
      'moderate_content',
      'access_admin_panel'
    ]
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  profile: {
    bio: {
      type: String,
      maxlength: 500
    },
    graduationYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 10
    },
    degree: {
      type: String,
      maxlength: 100
    },
    major: {
      type: String,
      maxlength: 100
    },
    currentJob: {
      type: String,
      maxlength: 100
    },
    company: {
      type: String,
      maxlength: 100
    },
    location: {
      city: String,
      state: String,
      country: String
    },
    phone: {
      type: String,
      maxlength: 20
    },
    website: {
      type: String,
      maxlength: 200
    },
    linkedin: {
      type: String,
      maxlength: 200
    },
    profilePicture: {
      type: String,
      default: ''
    },
    coverPhoto: {
      type: String,
      default: ''
    },
    documents: [{
      name: String,
      url: String,
      type: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    skills: [String],
    interests: [String]
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    eventNotifications: {
      type: Boolean,
      default: true
    },
    messageNotifications: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'profile.graduationYear': 1 });
userSchema.index({ 'profile.location.city': 1 });
userSchema.index({ lastActiveAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Role-based permission methods
userSchema.methods.hasPermission = function(permission) {
  // Super admin has all permissions
  if (this.role === 'super_admin') return true;
  
  // Check if user has the specific permission
  return this.permissions.includes(permission);
};

userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

userSchema.methods.hasAnyRole = function(roles) {
  return roles.includes(this.role);
};

userSchema.methods.isUserActive = function() {
  return ['active', 'pending_verification'].includes(this.status);
};

userSchema.methods.isVerified = function() {
  return this.status === 'active' && this.verifiedAt !== null;
};

userSchema.methods.canAccessAdminPanel = function() {
  return this.hasPermission('access_admin_panel') && this.isUserActive();
};

userSchema.methods.canManageUsers = function() {
  return this.hasPermission('manage_users') && this.isUserActive();
};

userSchema.methods.canModerateContent = function() {
  return this.hasPermission('moderate_content') && this.isUserActive();
};

// Set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    this.permissions = this.getDefaultPermissions();
  }
  next();
});

userSchema.methods.getDefaultPermissions = function() {
  const rolePermissions = {
    student: [
      'read_profile',
      'edit_profile',
      'view_alumni',
      'send_messages'
    ],
    alumni: [
      'read_profile',
      'edit_profile',
      'view_alumni',
      'send_messages',
      'create_events',
      'create_news',
      'create_campaigns'
    ],
    admin: [
      'read_profile',
      'edit_profile',
      'view_alumni',
      'send_messages',
      'create_events',
      'edit_events',
      'delete_events',
      'create_news',
      'edit_news',
      'delete_news',
      'create_campaigns',
      'manage_users',
      'view_analytics',
      'manage_donations',
      'moderate_content',
      'access_admin_panel'
    ],
    super_admin: [
      'read_profile',
      'edit_profile',
      'view_alumni',
      'send_messages',
      'create_events',
      'edit_events',
      'delete_events',
      'create_news',
      'edit_news',
      'delete_news',
      'create_campaigns',
      'manage_users',
      'manage_roles',
      'view_analytics',
      'manage_donations',
      'moderate_content',
      'access_admin_panel'
    ]
  };
  
  return rolePermissions[this.role] || rolePermissions.student;
};

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
