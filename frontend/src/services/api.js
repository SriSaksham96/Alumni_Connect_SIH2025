import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getAlumniDirectory: (params) => api.get('/users/alumni/directory', { params }),
  uploadDocument: (id, formData) => api.post(`/users/${id}/upload-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // Admin dashboard methods
  getDashboardStats: () => api.get('/users/dashboard/stats'),
  getDashboardActivity: () => api.get('/users/dashboard/activity'),
  updateUserStatus: (id, statusData) => api.put(`/users/${id}/status`, statusData),
  changeUserRole: (id, roleData) => api.put(`/auth/change-role/${id}`, roleData),
};

// Messages API
export const messagesAPI = {
  getMessages: (params) => api.get('/messages', { params }),
  getConversation: (userId, params) => api.get(`/messages/conversation/${userId}`, { params }),
  sendMessage: (messageData) => api.post('/messages', messageData),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  updateMessage: (messageId, content) => api.put(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

// Events API
export const eventsAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  registerForEvent: (id, notes) => api.post(`/events/${id}/register`, { notes }),
  cancelRegistration: (id) => api.delete(`/events/${id}/register`),
  getUserEvents: (params) => api.get('/events/user/registered', { params }),
};

// News API
export const newsAPI = {
  getNews: (params) => api.get('/news', { params }),
  getNewsArticle: (id) => api.get(`/news/${id}`),
  createNews: (articleData) => api.post('/news', articleData),
  updateNews: (id, articleData) => api.put(`/news/${id}`, articleData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteNews: (id) => api.delete(`/news/${id}`),
  likeNews: (id) => api.post(`/news/${id}/like`),
  addComment: (id, content) => api.post(`/news/${id}/comment`, { content }),
  getCategories: () => api.get('/news/categories'),
  getFeaturedNews: (params) => api.get('/news/featured', { params }),
};

// Donations API
export const donationsAPI = {
  getDonations: (params) => api.get('/donations', { params }),
  getUserDonations: (params) => api.get('/donations/user', { params }),
  createDonation: (donationData) => api.post('/donations', donationData),
  getDonation: (id) => api.get(`/donations/${id}`),
  updateDonationStatus: (id, status) => api.put(`/donations/${id}/status`, { paymentStatus: status }),
  getDonationStats: () => api.get('/donations/stats'),
  getCampaigns: () => api.get('/donations/campaigns'),
  createCampaign: (campaignData) => api.post('/donations/campaigns', campaignData),
};

// Admin API
export const adminAPI = {
  // Events
  getEvents: (params) => api.get('/admin/events', { params }),
  updateEvent: (id, eventData) => api.put(`/admin/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  
  // News
  getNews: (params) => api.get('/admin/news', { params }),
  updateNews: (id, newsData) => api.put(`/admin/news/${id}`, newsData),
  deleteNews: (id) => api.delete(`/admin/news/${id}`),
  
  // Campaigns
  getCampaigns: (params) => api.get('/admin/campaigns', { params }),
  updateCampaign: (id, campaignData) => api.put(`/admin/campaigns/${id}`, campaignData),
  deleteCampaign: (id) => api.delete(`/admin/campaigns/${id}`),
  
  // Stats
  getStats: () => api.get('/admin/stats'),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return error.response.data.message || 'An error occurred';
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

export default api;
