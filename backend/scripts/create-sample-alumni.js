const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni_connect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleAlumni = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    password: 'password123',
    role: 'alumni',
    status: 'active',
    profile: {
      bio: 'Software engineer with 5 years of experience in full-stack development.',
      graduationYear: 2018,
      degree: 'B.Tech',
      major: 'Computer Science',
      currentJob: 'Senior Software Engineer',
      company: 'Google',
      phone: '+1 (555) 123-4567',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'United States'
      },
      website: 'https://johnsmith.dev',
      linkedin: 'https://linkedin.com/in/johnsmith',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      interests: ['Technology', 'Travel', 'Photography']
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    password: 'password123',
    role: 'alumni',
    status: 'active',
    profile: {
      bio: 'Product manager passionate about building user-centric products.',
      graduationYear: 2019,
      degree: 'MBA',
      major: 'Business Administration',
      currentJob: 'Product Manager',
      company: 'Microsoft',
      phone: '+1 (555) 234-5678',
      location: {
        city: 'Seattle',
        state: 'WA',
        country: 'United States'
      },
      website: 'https://sarahjohnson.com',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      skills: ['Product Management', 'Data Analysis', 'User Research', 'Agile'],
      interests: ['Innovation', 'Leadership', 'Fitness']
    }
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@example.com',
    password: 'password123',
    role: 'alumni',
    status: 'active',
    profile: {
      bio: 'Data scientist specializing in machine learning and AI.',
      graduationYear: 2020,
      degree: 'M.S.',
      major: 'Data Science',
      currentJob: 'Data Scientist',
      company: 'Amazon',
      phone: '+1 (555) 345-6789',
      location: {
        city: 'New York',
        state: 'NY',
        country: 'United States'
      },
      linkedin: 'https://linkedin.com/in/michaelchen',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'],
      interests: ['AI', 'Research', 'Chess']
    }
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    password: 'password123',
    role: 'alumni',
    status: 'active',
    profile: {
      bio: 'UX designer creating beautiful and functional user experiences.',
      graduationYear: 2017,
      degree: 'B.Des',
      major: 'Design',
      currentJob: 'Senior UX Designer',
      company: 'Apple',
      phone: '+1 (555) 456-7890',
      location: {
        city: 'Cupertino',
        state: 'CA',
        country: 'United States'
      },
      website: 'https://emilydavis.design',
      linkedin: 'https://linkedin.com/in/emilydavis',
      skills: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping'],
      interests: ['Design', 'Art', 'Music']
    }
  },
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@example.com',
    password: 'password123',
    role: 'alumni',
    status: 'active',
    profile: {
      bio: 'DevOps engineer focused on cloud infrastructure and automation.',
      graduationYear: 2016,
      degree: 'B.Tech',
      major: 'Information Technology',
      currentJob: 'DevOps Engineer',
      company: 'Netflix',
      phone: '+1 (555) 567-8901',
      location: {
        city: 'Los Gatos',
        state: 'CA',
        country: 'United States'
      },
      linkedin: 'https://linkedin.com/in/davidwilson',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Python'],
      interests: ['Cloud Computing', 'Automation', 'Gaming']
    }
  }
];

async function createSampleAlumni() {
  try {
    console.log('Creating sample alumni...');
    
    for (const alumniData of sampleAlumni) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: alumniData.email });
      if (existingUser) {
        console.log(`User ${alumniData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      alumniData.password = await bcrypt.hash(alumniData.password, salt);

      // Create user
      const user = new User(alumniData);
      await user.save();
      console.log(`Created alumni: ${alumniData.firstName} ${alumniData.lastName}`);
    }

    console.log('Sample alumni created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample alumni:', error);
    process.exit(1);
  }
}

createSampleAlumni();
