const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_connect';

async function createSuperAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@alumni.com' });
    if (existingSuperAdmin) {
      console.log('✅ Super Admin user already exists!');
      console.log('📧 Email: superadmin@alumni.com');
      console.log('🔑 Password: superadmin123');
      console.log('👤 Role: super_admin');
      process.exit(0);
    }

    // Create super admin user
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@alumni.com',
      password: 'superadmin123', // Will be hashed automatically by the model
      role: 'super_admin',
      status: 'active',
      verifiedAt: new Date(),
      profile: {
        bio: 'Super administrator with full system access for Alumni Connect platform.',
        graduationYear: 2005,
        degree: 'M.Tech',
        major: 'Computer Science',
        currentJob: 'Super Administrator',
        company: 'Alumni Connect',
        location: {
          city: 'New York',
          state: 'NY',
          country: 'United States'
        }
      }
    });

    await superAdmin.save();
    console.log('✅ Super Admin user created successfully!');
    console.log('📧 Email: superadmin@alumni.com');
    console.log('🔑 Password: superadmin123');
    console.log('👤 Role: super_admin');
    console.log('🔐 Status: active');
    console.log('✨ Ready to access admin dashboard with full privileges!');
    
  } catch (error) {
    console.error('❌ Error creating super admin user:', error.message);
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

createSuperAdminUser();
