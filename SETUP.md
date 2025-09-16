# Alumni Connect - Setup Guide

This guide will help you set up and run the Alumni Connect application locally or deploy it to a cloud service.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5.0 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)
- **Docker** (optional, for containerized deployment) - [Download here](https://www.docker.com/)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Alumni_Connect
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (root, backend, and frontend)
npm run install-all
```

### 3. Environment Setup

#### Backend Environment

1. Copy the example environment file:
```bash
cp backend/env.example backend/.env
```

2. Edit `backend/.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/alumni_connect

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment

1. Copy the example environment file:
```bash
cp frontend/env.example frontend/.env
```

2. Edit `frontend/.env` with your configuration:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_NAME=Alumni Connect
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=development
```

### 4. Start MongoDB

#### Option A: Local MongoDB
```bash
# Start MongoDB service
mongod

# Or if using Homebrew on macOS
brew services start mongodb-community
```

#### Option B: Docker MongoDB
```bash
docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password123 mongo:7.0
```

### 5. Run the Application

#### Development Mode (Recommended)

```bash
# Start both backend and frontend concurrently
npm run dev
```

This will start:
- Backend API on http://localhost:5000
- Frontend React app on http://localhost:3000

#### Individual Services

```bash
# Backend only
npm run server

# Frontend only
npm run client
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
6. Copy the Client ID and Client Secret to your environment files

## Cloudinary Setup (for file uploads)

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to your dashboard
3. Copy the Cloud Name, API Key, and API Secret
4. Add them to your backend environment file

## Database Setup

The application will automatically create the necessary collections and indexes when you first run it. However, you can also run the initialization script manually:

```bash
# Using MongoDB shell
mongo < backend/scripts/mongo-init.js
```

## API Documentation

Once the backend is running, you can access:

- **Health Check**: http://localhost:5000/api/health
- **API Base URL**: http://localhost:5000/api

### Main API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

#### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/alumni/directory` - Get alumni directory

#### Messages
- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation

#### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (admin only)
- `POST /api/events/:id/register` - Register for event

#### News
- `GET /api/news` - Get all news
- `POST /api/news` - Create news (admin only)
- `POST /api/news/:id/like` - Like news article

#### Donations
- `GET /api/donations` - Get all donations
- `POST /api/donations` - Create donation
- `GET /api/donations/stats` - Get donation statistics

## Docker Deployment

### Using Docker Compose

1. Make sure Docker and Docker Compose are installed
2. Update the environment variables in `docker-compose.yml`
3. Run the application:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Containers

```bash
# Build backend
cd backend
docker build -t alumni-connect-backend .

# Build frontend
cd frontend
docker build -t alumni-connect-frontend .

# Run with docker-compose
docker-compose up
```

## Production Deployment

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

#### Backend
- `NODE_ENV=production`
- `MONGODB_URI=mongodb://your-production-db`
- `JWT_SECRET=your-production-jwt-secret`
- `FRONTEND_URL=https://yourdomain.com`

#### Frontend
- `REACT_APP_API_URL=https://your-api-domain.com/api`

### Deployment Options

#### Heroku
1. Install Heroku CLI
2. Create Heroku apps for backend and frontend
3. Set environment variables
4. Deploy using Git

#### Vercel (Frontend)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Add environment variables

#### AWS/GCP/Azure
1. Use container services (ECS, Cloud Run, Container Instances)
2. Set up managed databases (DocumentDB, CosmosDB)
3. Configure load balancers and CDN

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in your environment file
   - Verify MongoDB is accessible on the specified port

2. **Port Already in Use**
   - Change the PORT in your environment file
   - Kill processes using the ports: `lsof -ti:5000 | xargs kill -9`

3. **CORS Errors**
   - Check that FRONTEND_URL is correctly set in backend environment
   - Ensure the frontend URL matches exactly

4. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure upload directories exist

5. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check Google OAuth credentials
   - Ensure redirect URIs are correct

### Logs

```bash
# Backend logs
cd backend && npm run dev

# Frontend logs
cd frontend && npm start

# Docker logs
docker-compose logs -f [service-name]
```

## Development

### Project Structure

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

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`, models in `backend/models/`
2. **Frontend**: Add pages in `frontend/src/pages/`, components in `frontend/src/components/`
3. **API Integration**: Update services in `frontend/src/services/api.js`

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, unique secrets
3. **CORS**: Configure properly for production
4. **File Uploads**: Validate file types and sizes
5. **Rate Limiting**: Configure appropriate limits
6. **HTTPS**: Use HTTPS in production
7. **Database**: Use connection strings with authentication

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the logs for error messages
4. Ensure all environment variables are set correctly

## License

This project is licensed under the MIT License.
