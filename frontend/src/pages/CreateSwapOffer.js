import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  HiArrowLeft, 
  HiBriefcase, 
  HiCog, 
  HiHome, 
  HiTag, 
  HiPlus, 
  HiTrash,
  HiMapPin,
  HiCalendar,
  HiClock,
  HiCurrencyDollar,
  HiSave
} from 'react-icons/hi';
import { swapAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateSwapOffer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState([{ day: '', startTime: '', endTime: '', timezone: 'UTC' }]);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      category: 'skill',
      estimatedValue: {
        currency: 'USD',
        isFlexible: true
      },
      availability: {
        isRecurring: false
      },
      accommodation: {
        smokingAllowed: false,
        petsAllowed: false
      }
    }
  });

  const watchedCategory = watch('category');

  const categories = [
    { value: 'skill', label: 'Skills', icon: HiBriefcase, description: 'Share your professional skills and expertise' },
    { value: 'service', label: 'Services', icon: HiCog, description: 'Offer services like consulting, tutoring, etc.' },
    { value: 'accommodation', label: 'Accommodation', icon: HiHome, description: 'Swap homes or provide accommodation' },
    { value: 'item', label: 'Items', icon: HiTag, description: 'Exchange physical items or equipment' },
    { value: 'other', label: 'Other', icon: HiTag, description: 'Anything else you want to offer' }
  ];

  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const timezones = [
    'UTC', 'EST', 'PST', 'CST', 'MST', 'GMT', 'CET', 'JST', 'AEST'
  ];

  const propertyTypes = [
    'apartment', 'house', 'condo', 'studio', 'room', 'other'
  ];

  const popularTags = [
    'web-development', 'design', 'marketing', 'consulting', 'photography',
    'writing', 'translation', 'tutoring', 'cooking', 'fitness',
    'travel', 'business', 'finance', 'legal', 'healthcare'
  ];

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { day: '', startTime: '', endTime: '', timezone: 'UTC' }]);
  };

  const removeTimeSlot = (index) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (index, field, value) => {
    const updated = [...timeSlots];
    updated[index][field] = value;
    setTimeSlots(updated);
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Prepare form data
      const offerData = {
        ...data,
        tags: tags,
        availability: {
          ...data.availability,
          timeSlots: timeSlots.filter(slot => slot.day && slot.startTime && slot.endTime)
        }
      };

      // Remove empty accommodation fields if not accommodation category
      if (data.category !== 'accommodation') {
        delete offerData.accommodation;
      }

      await swapAPI.createOffer(offerData);
      toast.success('Swap offer created successfully!');
      navigate('/swap');
    } catch (error) {
      console.error('Error creating swap offer:', error);
      const message = error.response?.data?.message || 'Failed to create swap offer';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
          <p className="mt-1 text-sm text-gray-500">
            Only admins can create swap offers. Users can browse offers and request swaps.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/swap')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Offers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/swap')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <HiArrowLeft className="h-4 w-4 mr-1" />
            Back to Marketplace
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6">
            <h1 className="text-2xl font-bold text-white">Create Swap Offer</h1>
            <p className="text-green-100 mt-1">
              Share what you can offer and what you'd like in return
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What are you offering? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <label
                      key={category.value}
                      className={`relative flex items-center p-4 border rounded-lg cursor-pointer ${
                        watchedCategory === category.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        value={category.value}
                        {...register('category', { required: 'Please select a category' })}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3">
                        <Icon className="h-6 w-6 text-gray-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {category.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {category.description}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  {...register('title', { 
                    required: 'Title is required',
                    maxLength: { value: 200, message: 'Title must be less than 200 characters' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Web Development Services"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory *
                </label>
                <input
                  type="text"
                  id="subcategory"
                  {...register('subcategory', { 
                    required: 'Subcategory is required',
                    maxLength: { value: 100, message: 'Subcategory must be less than 100 characters' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Frontend Development"
                />
                {errors.subcategory && (
                  <p className="mt-1 text-sm text-red-600">{errors.subcategory.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description', { 
                  required: 'Description is required',
                  maxLength: { value: 2000, message: 'Description must be less than 2000 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Describe what you're offering in detail..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* What you want in return */}
            <div>
              <label htmlFor="wantsInReturn" className="block text-sm font-medium text-gray-700 mb-1">
                What would you like in return? *
              </label>
              <textarea
                id="wantsInReturn"
                rows={3}
                {...register('wantsInReturn', { 
                  required: 'Please specify what you want in return',
                  maxLength: { value: 1000, message: 'Must be less than 1000 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Marketing consultation, accommodation in NYC, or photography services"
              />
              {errors.wantsInReturn && (
                <p className="mt-1 text-sm text-red-600">{errors.wantsInReturn.message}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <HiTrash className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={() => addTag(newTag)}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <HiPlus className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Popular tags:</p>
                <div className="flex flex-wrap gap-1">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Estimated Value */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="estimatedValue.amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Value
                </label>
                <input
                  type="number"
                  id="estimatedValue.amount"
                  {...register('estimatedValue.amount', { 
                    min: { value: 0, message: 'Value must be positive' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
                {errors.estimatedValue?.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimatedValue.amount.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="estimatedValue.currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  id="estimatedValue.currency"
                  {...register('estimatedValue.currency')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('estimatedValue.isFlexible')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Flexible</span>
                </label>
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Availability
              </label>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="availability.startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Available From
                    </label>
                    <input
                      type="date"
                      id="availability.startDate"
                      {...register('availability.startDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="availability.endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Available Until
                    </label>
                    <input
                      type="date"
                      id="availability.endDate"
                      {...register('availability.endDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('availability.isRecurring')}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Recurring availability</span>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slots
                  </label>
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <select
                        value={slot.day}
                        onChange={(e) => updateTimeSlot(index, 'day', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select day</option>
                        {days.map(day => (
                          <option key={day} value={day}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <select
                        value={slot.timezone}
                        onChange={(e) => updateTimeSlot(index, 'timezone', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {timezones.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                      {timeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTimeSlot}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    + Add time slot
                  </button>
                </div>
              </div>
            </div>

            {/* Accommodation-specific fields */}
            {watchedCategory === 'accommodation' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Accommodation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="accommodation.propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type *
                    </label>
                    <select
                      id="accommodation.propertyType"
                      {...register('accommodation.propertyType', { 
                        required: watchedCategory === 'accommodation' ? 'Property type is required' : false
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select type</option>
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.accommodation?.propertyType && (
                      <p className="mt-1 text-sm text-red-600">{errors.accommodation.propertyType.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="accommodation.maxGuests" className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Guests *
                    </label>
                    <input
                      type="number"
                      id="accommodation.maxGuests"
                      min="1"
                      {...register('accommodation.maxGuests', { 
                        required: watchedCategory === 'accommodation' ? 'Maximum guests is required' : false,
                        min: { value: 1, message: 'Must be at least 1' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {errors.accommodation?.maxGuests && (
                      <p className="mt-1 text-sm text-red-600">{errors.accommodation.maxGuests.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="accommodation.bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      id="accommodation.bedrooms"
                      min="0"
                      {...register('accommodation.bedrooms', { 
                        min: { value: 0, message: 'Must be 0 or more' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="accommodation.bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      id="accommodation.bathrooms"
                      min="0"
                      step="0.5"
                      {...register('accommodation.bathrooms', { 
                        min: { value: 0, message: 'Must be 0 or more' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="accommodation.minimumStay" className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Stay (days)
                    </label>
                    <input
                      type="number"
                      id="accommodation.minimumStay"
                      min="1"
                      {...register('accommodation.minimumStay', { 
                        min: { value: 1, message: 'Must be at least 1 day' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="accommodation.maximumStay" className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Stay (days)
                    </label>
                    <input
                      type="number"
                      id="accommodation.maximumStay"
                      min="1"
                      {...register('accommodation.maximumStay', { 
                        min: { value: 1, message: 'Must be at least 1 day' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('accommodation.smokingAllowed')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Smoking allowed</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('accommodation.petsAllowed')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pets allowed</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/swap')}
                  className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating Offer...
                    </>
                  ) : (
                    <>
                      <HiSave className="h-4 w-4 mr-2" />
                      Create Offer
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSwapOffer;
