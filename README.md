# Alumni Connect

A comprehensive full-stack web application for alumni networking, featuring user profiles, messaging, events, news, and donation tracking.

## Features

- **Authentication**: OAuth (Google) and email/password authentication
- **Role-based Access Control**: Alumni and Admin user roles
- **User Profiles**: Career updates, academic info, document uploads
- **Messaging**: Direct messaging between users
- **Events**: Event creation, registration, and management
- **News**: News posting and management
- **Donations**: Fundraising tracking and management
- **Security**: Secure, scalable, and privacy-compliant

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios for API calls
- React Router for navigation

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Passport.js for OAuth
- Multer for file uploads

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Google OAuth credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `backend` and `frontend` directories
   - Fill in your configuration values

4. Start the development servers:
   ```bash
   npm run dev
   ```

## Project Structure

```
alumni-connect/
├── backend/                 # Node.js/Express backend
│   ├── controllers/         # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── config/             # Database and app configuration
│   └── uploads/            # File uploads directory
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── context/        # React context providers
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
└── docs/                   # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Messages
- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark message as read

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (admin only)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event (admin only)
- `POST /api/events/:id/register` - Register for event

### News
- `GET /api/news` - Get all news
- `POST /api/news` - Create news (admin only)
- `PUT /api/news/:id` - Update news
- `DELETE /api/news/:id` - Delete news (admin only)

### Donations
- `GET /api/donations` - Get all donations
- `POST /api/donations` - Create donation
- `GET /api/donations/stats` - Get donation statistics

## Deployment

The application is configured for deployment on cloud services like Heroku, Vercel, or AWS. See individual README files in `backend/` and `frontend/` directories for specific deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
