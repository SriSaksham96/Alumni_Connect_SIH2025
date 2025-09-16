import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { HiCalendar, HiLocationMarker, HiUsers, HiClock, HiArrowLeft, HiShare, HiHeart, HiChat } from 'react-icons/hi';
import { eventsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registrationNotes, setRegistrationNotes] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const { data: event, isLoading, error, refetch } = useQuery(
    ['event', id],
    () => eventsAPI.getEvent(id),
    {
      enabled: !!id,
    }
  );

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please log in to register for events');
      return;
    }

    try {
      await eventsAPI.registerForEvent(id, { notes: registrationNotes });
      toast.success('Successfully registered for event!');
      setShowRegistrationModal(false);
      setRegistrationNotes('');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register for event');
    }
  };

  const handleCancelRegistration = async () => {
    try {
      await eventsAPI.cancelRegistration(id);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Event not found</h3>
              <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
              <button
                onClick={() => navigate('/events')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <HiArrowLeft className="w-5 h-5" />
          Back to Events
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Event Image */}
              {event.images && event.images.length > 0 && (
                <div className="h-64 md:h-80 bg-gray-200">
                  <img
                    src={event.images[0].url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                {/* Event Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.eventType === 'networking' ? 'bg-blue-100 text-blue-800' :
                        event.eventType === 'reunion' ? 'bg-green-100 text-green-800' :
                        event.eventType === 'workshop' ? 'bg-purple-100 text-purple-800' :
                        event.eventType === 'conference' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.eventType}
                      </span>
                      <span className="flex items-center gap-1">
                        <HiUsers className="w-4 h-4" />
                        {event.registrationCount || 0} registered
                        {event.capacity && ` / ${event.capacity}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Description */}
                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <HiCalendar className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-900">Date & Time</h3>
                        <p className="text-gray-600">{formatDate(event.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <HiLocationMarker className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-900">Location</h3>
                        <p className="text-gray-600">
                          {event.location.venue}
                          <br />
                          {event.location.address.street && `${event.location.address.street}, `}
                          {event.location.address.city}, {event.location.address.state} {event.location.address.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {event.organizer && (
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded-full mt-1"></div>
                        <div>
                          <h3 className="font-medium text-gray-900">Organizer</h3>
                          <p className="text-gray-600">
                            {event.organizer.firstName} {event.organizer.lastName}
                          </p>
                        </div>
                      </div>
                    )}

                    {event.tags && event.tags.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {event.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Images */}
                {event.images && event.images.length > 1 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">More Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {event.images.slice(1).map((image, index) => (
                        <img
                          key={index}
                          src={image.url}
                          alt={image.caption || event.title}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Actions</h3>
              
              {user ? (
                event.isRegistered ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">You're registered for this event</p>
                    </div>
                    <button
                      onClick={handleCancelRegistration}
                      className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                    >
                      Cancel Registration
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {event.capacity && event.registrationCount >= event.capacity ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm font-medium">Event is full</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowRegistrationModal(true)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Register for Event
                      </button>
                    )}
                  </div>
                )
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">Please log in to register for events</p>
                </div>
              )}

              {/* Event Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Event Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Registration Fee:</span>
                    <span className="font-medium">
                      {event.registrationFee ? `$${event.registrationFee}` : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span className="font-medium">
                      {event.capacity ? `${event.registrationCount || 0} / ${event.capacity}` : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registration Deadline:</span>
                    <span className="font-medium">
                      {event.registrationDeadline 
                        ? new Date(event.registrationDeadline).toLocaleDateString()
                        : 'No deadline'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Modal */}
        {showRegistrationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Register for Event</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={registrationNotes}
                  onChange={(e) => setRegistrationNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requirements or notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegistrationModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegister}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
