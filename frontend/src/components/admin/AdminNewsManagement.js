import React, { useState, useEffect } from 'react';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiEye, 
  HiNewspaper, 
  HiTag,
  HiStatusOnline,
  HiStatusOffline,
  HiX,
  HiCheck,
  HiStar,
  HiEyeOff
} from 'react-icons/hi';
import { adminAPI, newsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminNewsManagement = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'general',
    tags: [],
    status: 'published',
    isFeatured: false,
    isPublic: true,
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getNews({ limit: 100 });
      setNews(response.data.news);
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Article title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Article content is required';
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Article excerpt is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (editingNews) {
        await adminAPI.updateNews(editingNews._id, formData);
        toast.success('News article updated successfully');
      } else {
        await newsAPI.createNews(formData);
        toast.success('News article created successfully');
      }
      
      setShowModal(false);
      setEditingNews(null);
      resetForm();
      loadNews();
    } catch (error) {
      console.error('Error saving news article:', error);
      toast.error('Failed to save news article');
    }
  };

  const handleEdit = (article) => {
    setEditingNews(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      category: article.category,
      tags: article.tags || [],
      status: article.status,
      isFeatured: article.isFeatured || false,
      isPublic: article.isPublic !== false,
      publishDate: article.publishDate ? new Date(article.publishDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: article.expiryDate ? new Date(article.expiryDate).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this news article? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteNews(articleId);
      toast.success('News article deleted successfully');
      loadNews();
    } catch (error) {
      console.error('Error deleting news article:', error);
      toast.error('Failed to delete news article');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'general',
      tags: [],
      status: 'published',
      isFeatured: false,
      isPublic: true,
      publishDate: new Date().toISOString().split('T')[0],
      expiryDate: ''
    });
    setErrors({});
    setNewTag('');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: HiEyeOff },
      published: { color: 'bg-green-100 text-green-800', icon: HiStatusOnline },
      archived: { color: 'bg-blue-100 text-blue-800', icon: HiCheck }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryColors = {
      general: 'bg-gray-100 text-gray-800',
      alumni: 'bg-blue-100 text-blue-800',
      events: 'bg-green-100 text-green-800',
      achievements: 'bg-yellow-100 text-yellow-800',
      fundraising: 'bg-purple-100 text-purple-800',
      academic: 'bg-indigo-100 text-indigo-800',
      sports: 'bg-red-100 text-red-800',
      other: 'bg-pink-100 text-pink-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[category] || categoryColors.general}`}>
        {category}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            News Management
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage all news articles in the system
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingNews(null);
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <HiPlus className="h-4 w-4 mr-2" />
          Add Article
        </button>
      </div>

      {/* News Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Published
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {news.map((article) => (
                <tr key={article._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {article.isFeatured && (
                          <HiStar className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {article.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {article.excerpt || article.content.substring(0, 100) + '...'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {article.tags?.slice(0, 3).map(tag => (
                            <span key={tag} className="mr-1">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {article.author?.profile?.profilePicture ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={article.author.profile.profilePicture}
                            alt={article.author.firstName}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {article.author?.firstName?.[0]}{article.author?.lastName?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {article.author?.firstName} {article.author?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {article.author?.role === 'admin' || article.author?.role === 'super_admin' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Alumni
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(article.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(article.publishDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(article.publishDate).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {article.views || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      {article.likeCount || 0} likes
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(article.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(article)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <HiPencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* News Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingNews ? 'Edit News Article' : 'Create New Article'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Article Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter article title"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General</option>
                        <option value="alumni">Alumni</option>
                        <option value="events">Events</option>
                        <option value="achievements">Achievements</option>
                        <option value="fundraising">Fundraising</option>
                        <option value="academic">Academic</option>
                        <option value="sports">Sports</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Publish Date
                      </label>
                      <input
                        type="date"
                        name="publishDate"
                        value={formData.publishDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Content</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Excerpt *
                      </label>
                      <textarea
                        name="excerpt"
                        rows={3}
                        value={formData.excerpt}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.excerpt ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Brief summary of the article"
                      />
                      {errors.excerpt && (
                        <p className="mt-1 text-sm text-red-600">{errors.excerpt}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content *
                      </label>
                      <textarea
                        name="content"
                        rows={8}
                        value={formData.content}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.content ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Write your article content here..."
                      />
                      {errors.content && (
                        <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Tags</h4>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <HiTag className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <HiX className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Public Article
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Featured Article
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingNews ? 'Update Article' : 'Create Article'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsManagement;
