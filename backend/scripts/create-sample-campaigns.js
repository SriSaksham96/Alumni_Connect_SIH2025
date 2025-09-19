const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_connect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleCampaigns = [
  {
    title: 'Scholarship Fund for Underprivileged Students',
    description: 'Help us provide scholarships to deserving students who cannot afford higher education. Your donation will directly impact a student\'s future.',
    targetAmount: 50000,
    currentAmount: 12500,
    status: 'active',
    isPublic: true,
    category: 'scholarship',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    images: [],
    tags: ['scholarship', 'education', 'students']
  },
  {
    title: 'Campus Infrastructure Development',
    description: 'Support the construction of a new library and computer lab to enhance the learning environment for current and future students.',
    targetAmount: 100000,
    currentAmount: 45000,
    status: 'active',
    isPublic: true,
    category: 'facilities',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-11-30'),
    images: [],
    tags: ['infrastructure', 'library', 'computer lab']
  },
  {
    title: 'Alumni Mentorship Program',
    description: 'Fund a mentorship program that connects current students with successful alumni for career guidance and professional development.',
    targetAmount: 25000,
    currentAmount: 8500,
    status: 'active',
    isPublic: true,
    category: 'general',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-10-31'),
    images: [],
    tags: ['mentorship', 'career', 'alumni']
  },
  {
    title: 'Research Equipment Fund',
    description: 'Help us purchase state-of-the-art research equipment for our science and engineering departments to support cutting-edge research.',
    targetAmount: 75000,
    currentAmount: 22000,
    status: 'active',
    isPublic: true,
    category: 'research',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-15'),
    images: [],
    tags: ['research', 'equipment', 'science', 'engineering']
  }
];

async function createSampleCampaigns() {
  try {
    console.log('Creating sample campaigns...');
    
    // Get the first admin user to be the organizer
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    for (const campaignData of sampleCampaigns) {
      // Check if campaign already exists
      const existingCampaign = await Campaign.findOne({ title: campaignData.title });
      if (existingCampaign) {
        console.log(`Campaign "${campaignData.title}" already exists, skipping...`);
        continue;
      }

      // Create campaign
      const campaign = new Campaign({
        ...campaignData,
        organizer: adminUser._id
      });
      
      await campaign.save();
      console.log(`Created campaign: ${campaignData.title}`);
    }

    console.log('Sample campaigns created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample campaigns:', error);
    process.exit(1);
  }
}

createSampleCampaigns();
