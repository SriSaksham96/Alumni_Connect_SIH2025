const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_connect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@alumni.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@alumni.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      verifiedAt: new Date(),
      profile: {
        bio: 'System administrator for Alumni Connect platform.',
        graduationYear: 2010,
        degree: 'B.Tech',
        major: 'Computer Science',
        currentJob: 'System Administrator',
        company: 'Alumni Connect',
        location: {
          city: 'San Francisco',
          state: 'CA',
          country: 'United States'
        }
      }
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@alumni.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
