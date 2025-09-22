import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { HiCalendar, HiLocationMarker, HiUsers, HiClock, HiSearch, HiFilter, HiX, HiPlus } from 'react-icons/hi';
import { eventsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Events = () => {
  const { user, hasPermission } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    startDate: '',
    endDate: '',
    location: '',
    graduationYear: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    ['events', page, filters],
    () => eventsAPI.getEvents({ page, ...filters }),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        console.log('Events API Success:', data);
      },
      onError: (error) => {
        console.error('Events API Error:', error);
      }
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      eventType: '',
      startDate: '',
      endDate: '',
      location: '',
      graduationYear: ''
    });
    setPage(1);
  };

  const handleRegister = async (eventId) => {
    if (!user) {
      toast.error('Please log in to register for events');
      return;
    }

    try {
      await eventsAPI.registerForEvent(eventId);
      toast.success('Successfully registered for event!');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register for event');
    }
  };

  const handleCancelRegistration = async (eventId) => {
    try {
      await eventsAPI.cancelRegistration(eventId);
      toast.success('Registration cancelled successfully');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel registration');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) return <LoadingSpinner />;

  console.log('Events render - data:', data, 'isLoading:', isLoading, 'error:', error);
  console.log('Events data structure:', data?.data);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Events</h1>
              <p className="mt-2 text-gray-600">Discover and register for upcoming alumni events</p>
            </div>
            {user && hasPermission('create_events') && (
              <Link
                to="/events/create"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <HiPlus className="w-4 h-4" />
                Create Event
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <HiFilter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={filters.eventType}
                    onChange={(e) => handleFilterChange('eventType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="networking">Networking</option>
                    <option value="reunion">Reunion</option>
                    <option value="workshop">Workshop</option>
                    <option value="conference">Conference</option>
                    <option value="social">Social</option>
                    <option value="fundraising">Fundraising</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="City, State, or Venue"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                  <input
                    type="number"
                    placeholder="e.g., 2020"
                    value={filters.graduationYear}
                    onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <HiX className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Events Grid */}
        {data?.data?.events?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {data.data.events.map((event) => (
              <div key={event._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {event.images && event.images.length > 0 && (
                  <div className="h-48 bg-gray-200">
                    <img
                      src={event.images[0].url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {event.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      event.eventType === 'networking' ? 'bg-blue-100 text-blue-800' :
                      event.eventType === 'reunion' ? 'bg-green-100 text-green-800' :
                      event.eventType === 'workshop' ? 'bg-purple-100 text-purple-800' :
                      event.eventType === 'conference' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {event.eventType}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Author Information */}
                  <div className="flex items-center mb-4 p-2 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {event.organizer?.profile?.profilePicture ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={event.organizer.profile.profilePicture}
                          alt={event.organizer.firstName}
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {event.organizer?.firstName?.[0]}{event.organizer?.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {event.organizer?.firstName} {event.organizer?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.organizer?.role === 'admin' || event.organizer?.role === 'super_admin' ? (
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

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <HiCalendar className="w-4 h-4 mr-2" />
                      {formatDate(event.date)}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <HiLocationMarker className="w-4 h-4 mr-2" />
                      {event.location?.venue}
                      {event.location?.address?.city ? `, ${event.location.address.city}` : ''}
                      {event.location?.address?.state ? `, ${event.location.address.state}` : ''}
                    </div>

                    {event.capacity && (
                      <div className="flex items-center text-sm text-gray-500">
                        <HiUsers className="w-4 h-4 mr-2" />
                        {event.registrationCount || 0} / {event.capacity} registered
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/events/${event._id}`}
                      className="flex-1 text-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      View Details
                    </Link>
                    
                    {user && (
                      event.isRegistered ? (
                        <button
                          onClick={() => handleCancelRegistration(event._id)}
                          className="flex-1 px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(event._id)}
                          disabled={event.capacity && event.registrationCount >= event.capacity}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {event.capacity && event.registrationCount >= event.capacity ? 'Full' : 'Register'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-12 text-center">
              <HiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">
                {Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters to see more events.'
                  : 'Check back later for upcoming events.'
                }
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Debug: data={JSON.stringify(data)}, events length={data?.data?.events?.length}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {data?.data?.pagination && data.data.pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!data.data.pagination.hasPrev}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {data.data.pagination.currentPage} of {data.data.pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={!data.data.pagination.hasNext}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
