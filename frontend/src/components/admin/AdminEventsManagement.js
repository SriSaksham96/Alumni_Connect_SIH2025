import React, { useState, useEffect } from 'react';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiEye, 
  HiCalendar, 
  HiLocationMarker,
  HiUsers,
  HiClock,
  HiStatusOnline,
  HiStatusOffline,
  HiX,
  HiCheck
} from 'react-icons/hi';
import { adminAPI, eventsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminEventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'networking',
    date: '',
    endDate: '',
    time: { start: '', end: '' },
    location: {
      venue: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      isVirtual: false,
      virtualLink: ''
    },
    capacity: 100,
    registrationDeadline: '',
    registrationFee: 0,
    isPublic: true,
    status: 'published',
    isFeatured: false,
    tags: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getEvents({ limit: 100 });
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'location' && child === 'address') {
        const [addressKey] = name.split('.').slice(2);
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            address: {
              ...prev.location.address,
              [addressKey]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

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
      newErrors.title = 'Event title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Event date is required';
    }

    if (!formData.location.venue.trim()) {
      newErrors['location.venue'] = 'Venue is required';
    }

    if (formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
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
      if (editingEvent) {
        await adminAPI.updateEvent(editingEvent._id, formData);
        toast.success('Event updated successfully');
      } else {
        await eventsAPI.createEvent(formData);
        toast.success('Event created successfully');
      }
      
      setShowModal(false);
      setEditingEvent(null);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
      time: event.time || { start: '', end: '' },
      location: {
        venue: event.location?.venue || '',
        address: {
          street: event.location?.address?.street || '',
          city: event.location?.address?.city || '',
          state: event.location?.address?.state || '',
          zipCode: event.location?.address?.zipCode || '',
          country: event.location?.address?.country || ''
        },
        isVirtual: event.location?.isVirtual || false,
        virtualLink: event.location?.virtualLink || ''
      },
      capacity: event.capacity || 100,
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '',
      registrationFee: event.registrationFee || 0,
      isPublic: event.isPublic !== false,
      status: event.status || 'published',
      isFeatured: event.isFeatured || false,
      tags: event.tags || []
    });
    setShowModal(true);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteEvent(eventId);
      toast.success('Event deleted successfully');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventType: 'networking',
      date: '',
      endDate: '',
      time: { start: '', end: '' },
      location: {
        venue: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        },
        isVirtual: false,
        virtualLink: ''
      },
      capacity: 100,
      registrationDeadline: '',
      registrationFee: 0,
      isPublic: true,
      status: 'published',
      isFeatured: false,
      tags: []
    });
    setErrors({});
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: HiClock },
      published: { color: 'bg-green-100 text-green-800', icon: HiStatusOnline },
      cancelled: { color: 'bg-red-100 text-red-800', icon: HiX },
      completed: { color: 'bg-blue-100 text-blue-800', icon: HiCheck }
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
            Event Management
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage all events in the system
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingEvent(null);
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <HiPlus className="h-4 w-4 mr-2" />
          Add Event
        </button>
      </div>

      {/* Events Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
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
              {events.map((event) => (
                <tr key={event._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {event.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {event.description}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {event.eventType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {event.time?.start && event.time?.end 
                        ? `${event.time.start} - ${event.time.end}`
                        : 'Time TBD'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {event.location?.venue}
                    </div>
                    <div className="text-sm text-gray-500">
                      {event.location?.address?.city}, {event.location?.address?.state}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {event.registrationCount || 0} / {event.capacity}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.availableSpots || event.capacity} spots left
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <HiPencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event._id)}
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

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
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
                        Event Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.title ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter event title"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.description ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter event description"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Type
                      </label>
                      <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="networking">Networking</option>
                        <option value="reunion">Reunion</option>
                        <option value="workshop">Workshop</option>
                        <option value="seminar">Seminar</option>
                        <option value="social">Social</option>
                        <option value="fundraising">Fundraising</option>
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
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Date & Time</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.date ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          name="time.start"
                          value={formData.time.start}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          name="time.end"
                          value={formData.time.end}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration Deadline
                      </label>
                      <input
                        type="date"
                        name="registrationDeadline"
                        value={formData.registrationDeadline}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Location</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue *
                    </label>
                    <input
                      type="text"
                      name="location.venue"
                      value={formData.location.venue}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors['location.venue'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter venue name"
                    />
                    {errors['location.venue'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['location.venue']}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="location.address.street"
                        value={formData.location.address.street}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="location.address.city"
                        value={formData.location.address.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="location.address.state"
                        value={formData.location.address.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        name="location.address.zipCode"
                        value={formData.location.address.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter ZIP code"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="location.isVirtual"
                      checked={formData.location.isVirtual}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      This is a virtual event
                    </label>
                  </div>

                  {formData.location.isVirtual && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Virtual Meeting Link
                      </label>
                      <input
                        type="url"
                        name="location.virtualLink"
                        value={formData.location.virtualLink}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  )}
                </div>

                {/* Capacity & Fees */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      min="1"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.capacity ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.capacity && (
                      <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Fee ($)
                    </label>
                    <input
                      type="number"
                      name="registrationFee"
                      min="0"
                      step="0.01"
                      value={formData.registrationFee}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
                      Public Event
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
                      Featured Event
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
                    {editingEvent ? 'Update Event' : 'Create Event'}
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

export default AdminEventsManagement;
