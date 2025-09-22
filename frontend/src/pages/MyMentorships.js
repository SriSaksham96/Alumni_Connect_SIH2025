import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HiStar, 
  HiClock, 
  HiUser, 
  HiChat,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiPlus,
  HiEye
} from 'react-icons/hi';
import { mentorshipAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const MyMentorships = () => {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalMentorships: 0
  });

  const tabs = [
    { id: 'all', label: 'All', count: 0 },
    { id: 'pending', label: 'Pending', count: 0 },
    { id: 'active', label: 'Active', count: 0 },
    { id: 'completed', label: 'Completed', count: 0 }
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

      const response = await mentorshipAPI.getMyMentorships(params);
      setMentorships(response.data.mentorships);
      setPagination(response.data.pagination);

      // Update tab counts
      updateTabCounts(response.data.mentorships);
    } catch (error) {
      console.error('Error loading mentorships:', error);
      toast.error('Failed to load mentorships');
    } finally {
      setLoading(false);
    }
  };

  const updateTabCounts = (mentorships) => {
    const counts = {
      all: mentorships.length,
      pending: 0,
      active: 0,
      completed: 0
    };

    mentorships.forEach(mentorship => {
      if (counts.hasOwnProperty(mentorship.status)) {
        counts[mentorship.status]++;
      }
    });

    // Update tab counts (this would need to be implemented with a separate API call for total counts)
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

  const getRoleLabel = (mentorship) => {
    if (mentorship.mentee._id === user._id) {
      return 'Mentee';
    } else if (mentorship.mentor._id === user._id) {
      return 'Mentor';
    }
    return 'Unknown';
  };

  const getOtherUser = (mentorship) => {
    if (mentorship.mentee._id === user._id) {
      return mentorship.mentor;
    } else {
      return mentorship.mentee;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Mentorships</h1>
              <p className="mt-2 text-gray-600">
                Manage your mentorship relationships and track your progress
              </p>
            </div>
            <Link
              to="/mentors"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <HiPlus className="h-4 w-4 mr-2" />
              Find a Mentor
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
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
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mentorships List */}
        {mentorships.length === 0 ? (
          <div className="text-center py-12">
            <HiUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No mentorships found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'all' 
                ? "You don't have any mentorship relationships yet."
                : `You don't have any ${activeTab} mentorships.`
              }
            </p>
            {activeTab === 'all' && (
              <div className="mt-6">
                <Link
                  to="/mentors"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <HiPlus className="h-4 w-4 mr-2" />
                  Find a Mentor
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {mentorships.map((mentorship) => {
              const otherUser = getOtherUser(mentorship);
              const role = getRoleLabel(mentorship);
              
              return (
                <div key={mentorship._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {otherUser.profile?.profilePicture ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={otherUser.profile.profilePicture}
                              alt={`${otherUser.firstName} ${otherUser.lastName}`}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {otherUser.firstName[0]}{otherUser.lastName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {otherUser.firstName} {otherUser.lastName}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(mentorship.status)}`}>
                              {getStatusIcon(mentorship.status)}
                              <span className="ml-1">{getStatusLabel(mentorship.status)}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {role === 'Mentee' ? 'Your mentor' : 'Your mentee'} • {otherUser.profile?.currentJob} at {otherUser.profile?.company}
                          </p>
                          {mentorship.requestMessage && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {mentorship.requestMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/mentorships/${mentorship._id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <HiEye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                      </div>
                    </div>

                    {/* Mentorship Details */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <HiClock className="h-4 w-4 mr-2" />
                        <span>
                          {mentorship.expectedDuration || '3-6 months'} duration
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <HiChat className="h-4 w-4 mr-2" />
                        <span>
                          {mentorship.meetingFrequency || 'monthly'} meetings
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <HiUser className="h-4 w-4 mr-2" />
                        <span>
                          {mentorship.sessions?.length || 0} sessions completed
                        </span>
                      </div>
                    </div>

                    {/* Focus Areas */}
                    {mentorship.focusAreas && mentorship.focusAreas.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-1">
                          {mentorship.focusAreas.slice(0, 3).map((area) => (
                            <span
                              key={area}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {area.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                          {mentorship.focusAreas.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{mentorship.focusAreas.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rating */}
                    {mentorship.overallRating && (
                      <div className="mt-4">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Overall Rating:</span>
                          <div className="flex items-center">
                            {role === 'Mentee' && mentorship.overallRating.menteeRating ? (
                              <>
                                {renderStars(mentorship.overallRating.menteeRating)}
                                <span className="ml-1 text-sm text-gray-500">
                                  ({mentorship.overallRating.menteeRating.toFixed(1)})
                                </span>
                              </>
                            ) : role === 'Mentor' && mentorship.overallRating.mentorRating ? (
                              <>
                                {renderStars(mentorship.overallRating.mentorRating)}
                                <span className="ml-1 text-sm text-gray-500">
                                  ({mentorship.overallRating.mentorRating.toFixed(1)})
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">No rating yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="mt-4 text-sm text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>
                          Started: {new Date(mentorship.createdAt).toLocaleDateString()}
                        </span>
                        {mentorship.endDate && (
                          <span>
                            Completed: {new Date(mentorship.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
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
    </div>
  );
};

export default MyMentorships;
