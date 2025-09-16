const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_connect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'testuser@example.com' });
    if (existingUser) {
      console.log('Test user already exists, updating password...');
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash('test123', salt);
      await existingUser.save();
      console.log('Password updated successfully!');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('test123', salt);

      // Create test user
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: hashedPassword,
        role: 'alumni',
        status: 'active',
        verifiedAt: new Date(),
        profile: {
          bio: 'Test user for alumni directory.',
          graduationYear: 2020,
          degree: 'B.Tech',
          major: 'Computer Science',
          currentJob: 'Software Engineer',
          company: 'Test Company',
          location: {
            city: 'Test City',
            state: 'TS',
            country: 'Test Country'
          },
          skills: ['JavaScript', 'React', 'Node.js'],
          interests: ['Technology', 'Testing']
        }
      });

      await user.save();
      console.log('Test user created successfully!');
    }
    
    console.log('Email: testuser@example.com');
    console.log('Password: test123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
