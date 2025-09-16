// MongoDB initialization script
db = db.getSiblingDB('alumni_connect');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firstName', 'lastName', 'email', 'role'],
      properties: {
        firstName: { bsonType: 'string', maxLength: 50 },
        lastName: { bsonType: 'string', maxLength: 50 },
        email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        role: { enum: ['alumni', 'admin'] },
        isActive: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('messages');
db.createCollection('events');
db.createCollection('news');
db.createCollection('donations');
db.createCollection('campaigns');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ 'profile.graduationYear': 1 });

db.messages.createIndex({ sender: 1, recipient: 1, createdAt: -1 });
db.messages.createIndex({ recipient: 1, isRead: 1 });

db.events.createIndex({ date: 1, status: 1 });
db.events.createIndex({ organizer: 1 });
db.events.createIndex({ eventType: 1 });

db.news.createIndex({ status: 1, publishDate: -1 });
db.news.createIndex({ author: 1 });
db.news.createIndex({ category: 1 });

db.donations.createIndex({ donor: 1, createdAt: -1 });
db.donations.createIndex({ paymentStatus: 1 });
db.donations.createIndex({ campaign: 1 });

print('Database initialized successfully');
