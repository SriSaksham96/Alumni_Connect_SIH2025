import React, { useState, useEffect } from 'react';
import { 
  HiTrash, 
  HiEye, 
  HiUser, 
  HiStar, 
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle
} from 'react-icons/hi';
import { mentorshipAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminMentorshipManagement = () => {
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalMentorships: 0
  });

  const tabs = [
    { id: 'all', label: 'All Mentorships' },
    { id: 'pending', label: 'Pending' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' }
  ];

  useEffect(() => {
    loadMentorships();
  }, [activeTab, pagination.currentPage]);

  const loadMentorships = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: 10
      };

      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      // For admin, we'll get all mentorships by making a request with admin privileges
      const response = await mentorshipAPI.getMyMentorships(params);
      setMentorships(response.data.mentorships);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading mentorships:', error);
      toast.error('Failed to load mentorships');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <HiClock className="h-5 w-5 text-yellow-500" />;
      case 'accepted':
      case 'active':
        return <HiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <HiStar className="h-5 w-5 text-blue-500" />;
      case 'rejected':
      case 'cancelled':
        return <HiXCircle className="h-5 w-5 text-red-500" />;
    default:
        return <HiExclamationCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<HiStar key={i} className="h-4 w-4 text-yellow-400 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<HiStar key="half" className="h-4 w-4 text-yellow-400 fill-current opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<HiStar key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mentorship Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage mentorship relationships and monitor progress
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mentorships Table */}
      {mentorships.length === 0 ? (
        <div className="text-center py-12">
          <HiUser className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No mentorships found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'all' 
              ? "There are no mentorship relationships yet."
              : `There are no ${activeTab} mentorships.`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {mentorships.map((mentorship) => (
              <li key={mentorship._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Mentor */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {mentorship.mentor.profile?.profilePicture ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={mentorship.mentor.profile.profilePicture}
                              alt={`${mentorship.mentor.firstName} ${mentorship.mentor.lastName}`}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {mentorship.mentor.firstName[0]}{mentorship.mentor.lastName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {mentorship.mentor.firstName} {mentorship.mentor.lastName}
                          </p>
                          <p className="text-sm text-gray-500">Mentor</p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>

                      {/* Mentee */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {mentorship.mentee.profile?.profilePicture ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={mentorship.mentee.profile.profilePicture}
                              alt={`${mentorship.mentee.firstName} ${mentorship.mentee.lastName}`}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {mentorship.mentee.firstName[0]}{mentorship.mentee.lastName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {mentorship.mentee.firstName} {mentorship.mentee.lastName}
                          </p>
                          <p className="text-sm text-gray-500">Mentee</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Status */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(mentorship.status)}`}>
                        {getStatusIcon(mentorship.status)}
                        <span className="ml-1">{getStatusLabel(mentorship.status)}</span>
                      </span>

                      {/* Rating */}
                      {mentorship.overallRating && (
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {renderStars(mentorship.overallRating.menteeRating || mentorship.overallRating.mentorRating)}
                          </div>
                          <span className="ml-1 text-sm text-gray-500">
                            ({(mentorship.overallRating.menteeRating || mentorship.overallRating.mentorRating || 0).toFixed(1)})
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // View mentorship details
                            console.log('View mentorship:', mentorship._id);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <HiEye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            // Delete mentorship
                            if (window.confirm('Are you sure you want to delete this mentorship?')) {
                              console.log('Delete mentorship:', mentorship._id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <HiTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Duration:</span> {mentorship.expectedDuration || '3-6 months'}
                    </div>
                    <div>
                      <span className="font-medium">Frequency:</span> {mentorship.meetingFrequency || 'monthly'}
                    </div>
                    <div>
                      <span className="font-medium">Sessions:</span> {mentorship.sessions?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Started:</span> {new Date(mentorship.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Focus Areas */}
                  {mentorship.focusAreas && mentorship.focusAreas.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {mentorship.focusAreas.slice(0, 5).map((area) => (
                          <span
                            key={area}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {area.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                        {mentorship.focusAreas.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{mentorship.focusAreas.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Request Message */}
                  {mentorship.requestMessage && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Request:</span> {mentorship.requestMessage}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={!pagination.hasNext}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMentorshipManagement;
