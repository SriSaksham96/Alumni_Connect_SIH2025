import React, { useState, useEffect } from 'react';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiEye, 
  HiCurrencyDollar, 
  HiCalendar,
  HiStatusOnline,
  HiStatusOffline,
  HiX,
  HiCheck,
  HiStar,
  HiPause,
  HiPlay
} from 'react-icons/hi';
import { adminAPI, donationsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminCampaignsManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: 'general',
    targetAmount: '',
    currency: 'USD',
    startDate: '',
    endDate: '',
    status: 'active',
    isPublic: true,
    isFeatured: false,
    tags: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getCampaigns({ limit: 100 });
      setCampaigns(response.data.campaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load campaigns');
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Campaign description is required';
    }

    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = 'Valid target amount is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
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
      const campaignData = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount)
      };

      if (editingCampaign) {
        await adminAPI.updateCampaign(editingCampaign._id, campaignData);
        toast.success('Campaign updated successfully');
      } else {
        await donationsAPI.createCampaign(campaignData);
        toast.success('Campaign created successfully');
      }
      
      setShowModal(false);
      setEditingCampaign(null);
      resetForm();
      loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      shortDescription: campaign.shortDescription || '',
      category: campaign.category,
      targetAmount: campaign.targetAmount.toString(),
      currency: campaign.currency,
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
      status: campaign.status,
      isPublic: campaign.isPublic !== false,
      isFeatured: campaign.isFeatured || false,
      tags: campaign.tags || []
    });
    setShowModal(true);
  };

  const handleDelete = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteCampaign(campaignId);
      toast.success('Campaign deleted successfully');
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      shortDescription: '',
      category: 'general',
      targetAmount: '',
      currency: 'USD',
      startDate: '',
      endDate: '',
      status: 'active',
      isPublic: true,
      isFeatured: false,
      tags: []
    });
    setErrors({});
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: HiX },
      active: { color: 'bg-green-100 text-green-800', icon: HiStatusOnline },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: HiPause },
      completed: { color: 'bg-blue-100 text-blue-800', icon: HiCheck },
      cancelled: { color: 'bg-red-100 text-red-800', icon: HiX }
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
      scholarship: 'bg-blue-100 text-blue-800',
      facilities: 'bg-green-100 text-green-800',
      research: 'bg-purple-100 text-purple-800',
      emergency: 'bg-red-100 text-red-800',
      events: 'bg-yellow-100 text-yellow-800',
      general: 'bg-gray-100 text-gray-800',
      other: 'bg-pink-100 text-pink-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[category] || categoryColors.general}`}>
        {category}
      </span>
    );
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const calculateProgress = (current, target) => {
    return Math.min(100, Math.round((current / target) * 100));
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
            Campaign Management
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage all donation campaigns in the system
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCampaign(null);
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <HiPlus className="h-4 w-4 mr-2" />
          Add Campaign
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organizer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
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
              {campaigns.map((campaign) => (
                <tr key={campaign._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {campaign.isFeatured && (
                          <HiStar className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {campaign.shortDescription || campaign.description.substring(0, 100) + '...'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {campaign.tags?.slice(0, 3).map(tag => (
                            <span key={tag} className="mr-1">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {campaign.organizer?.profile?.profilePicture ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={campaign.organizer.profile.profilePicture}
                            alt={campaign.organizer.firstName}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {campaign.organizer?.firstName?.[0]}{campaign.organizer?.lastName?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.organizer?.firstName} {campaign.organizer?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {campaign.organizer?.role === 'admin' || campaign.organizer?.role === 'super_admin' ? (
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
                    {getCategoryBadge(campaign.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(campaign.targetAmount, campaign.currency)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(campaign.currentAmount || 0, campaign.currency)} raised
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${calculateProgress(campaign.currentAmount || 0, campaign.targetAmount)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {calculateProgress(campaign.currentAmount || 0, campaign.targetAmount)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(campaign.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {new Date(campaign.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {campaign.daysRemaining || 0} days left
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <HiPencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(campaign._id)}
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

      {/* Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
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
                        Campaign Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter campaign title"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Short Description *
                      </label>
                      <textarea
                        name="shortDescription"
                        rows={2}
                        value={formData.shortDescription}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.shortDescription ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Brief description for previews"
                      />
                      {errors.shortDescription && (
                        <p className="mt-1 text-sm text-red-600">{errors.shortDescription}</p>
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
                        <option value="scholarship">Scholarship</option>
                        <option value="facilities">Facilities</option>
                        <option value="research">Research</option>
                        <option value="emergency">Emergency</option>
                        <option value="events">Events</option>
                        <option value="general">General</option>
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
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Financial Information</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Amount *
                      </label>
                      <div className="flex">
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CAD">CAD</option>
                          <option value="AUD">AUD</option>
                        </select>
                        <input
                          type="number"
                          name="targetAmount"
                          min="1"
                          step="0.01"
                          value={formData.targetAmount}
                          onChange={handleInputChange}
                          className={`flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.targetAmount ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter target amount"
                        />
                      </div>
                      {errors.targetAmount && (
                        <p className="mt-1 text-sm text-red-600">{errors.targetAmount}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.startDate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.endDate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Description</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Description *
                    </label>
                    <textarea
                      name="description"
                      rows={6}
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Detailed description of the campaign..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
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
                      Public Campaign
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
                      Featured Campaign
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
                    {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
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

export default AdminCampaignsManagement;
