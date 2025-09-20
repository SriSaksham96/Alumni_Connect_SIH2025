const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_connect';

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@alumni.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@alumni.com');
      console.log('🔑 Password: admin123');
      console.log('👤 Role: admin');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@alumni.com',
      password: 'admin123', // Will be hashed automatically by the model
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
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@alumni.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('🔐 Status: active');
    console.log('✨ Ready to access admin dashboard!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 MongoDB is not running. Please start MongoDB first:');
      console.log('   - Install MongoDB locally, or');
      console.log('   - Use Docker: docker run -d -p 27017:27017 mongo:latest, or');
      console.log('   - Use MongoDB Atlas (cloud)');
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdminUser();
