const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_connect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    const users = await User.find({}).select('firstName lastName email role status');
    console.log(`Found ${users.length} users:`);
    
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
    });
    
    const alumni = await User.find({ role: 'alumni' }).select('firstName lastName email');
    console.log(`\nFound ${alumni.length} alumni:`);
    
    alumni.forEach(alumni => {
      console.log(`- ${alumni.firstName} ${alumni.lastName} (${alumni.email})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();
