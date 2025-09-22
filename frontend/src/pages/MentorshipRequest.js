import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  HiArrowLeft, 
  HiUser, 
  HiStar, 
  HiLocationMarker,
  HiCheckCircle,
  HiXCircle
} from 'react-icons/hi';
import { mentorshipAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const MentorshipRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    requestMessage: '',
    expectedDuration: '3-6 months',
    meetingFrequency: 'monthly',
    communicationMethod: 'mixed',
    goals: [''],
    focusAreas: []
  });

  const durationOptions = [
    { value: '1-3 months', label: '1-3 months' },
    { value: '3-6 months', label: '3-6 months' },
    { value: '6-12 months', label: '6-12 months' },
    { value: '1+ years', label: '1+ years' },
    { value: 'ongoing', label: 'Ongoing' }
  ];

  const frequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'as-needed', label: 'As needed' }
  ];

  const communicationOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'video-call', label: 'Video Call' },
    { value: 'in-person', label: 'In Person' },
    { value: 'mixed', label: 'Mixed' }
  ];

  const focusAreaOptions = [
    { value: 'career-guidance', label: 'Career Guidance' },
    { value: 'skill-development', label: 'Skill Development' },
    { value: 'networking', label: 'Networking' },
    { value: 'industry-insights', label: 'Industry Insights' },
    { value: 'resume-review', label: 'Resume Review' },
    { value: 'interview-prep', label: 'Interview Prep' },
    { value: 'entrepreneurship', label: 'Entrepreneurship' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'work-life-balance', label: 'Work-Life Balance' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (user?.role !== 'student') {
      toast.error('Only students can request mentorship');
      navigate('/mentors');
      return;
    }
    loadMentorProfile();
  }, [id, user]);

  const loadMentorProfile = async () => {
    try {
      setLoading(true);
      const response = await mentorshipAPI.getMentor(id);
      setMentor(response.data.mentor);
    } catch (error) {
      console.error('Error loading mentor profile:', error);
      toast.error('Failed to load mentor profile');
      navigate('/mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoalChange = (index, value) => {
    const newGoals = [...formData.goals];
    newGoals[index] = value;
    setFormData(prev => ({
      ...prev,
      goals: newGoals
    }));
  };

  const addGoal = () => {
    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }));
  };

  const removeGoal = (index) => {
    if (formData.goals.length > 1) {
      const newGoals = formData.goals.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        goals: newGoals
      }));
    }
  };

  const handleFocusAreaToggle = (focusArea) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(focusArea)
        ? prev.focusAreas.filter(area => area !== focusArea)
        : [...prev.focusAreas, focusArea]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.requestMessage.trim()) {
      toast.error('Please provide a request message');
      return;
    }

    if (formData.goals.every(goal => !goal.trim())) {
      toast.error('Please provide at least one goal');
      return;
    }

    if (formData.focusAreas.length === 0) {
      toast.error('Please select at least one focus area');
      return;
    }

    try {
      setSubmitting(true);
      
      const requestData = {
        mentorId: id,
        requestMessage: formData.requestMessage.trim(),
        expectedDuration: formData.expectedDuration,
        meetingFrequency: formData.meetingFrequency,
        communicationMethod: formData.communicationMethod,
        goals: formData.goals.filter(goal => goal.trim()),
        focusAreas: formData.focusAreas
      };

      await mentorshipAPI.sendRequest(requestData);
      toast.success('Mentorship request sent successfully!');
      navigate('/my-mentorships');
    } catch (error) {
      console.error('Error sending mentorship request:', error);
      const message = error.response?.data?.message || 'Failed to send mentorship request';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
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

  if (!mentor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HiXCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Mentor not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The mentor you're looking for doesn't exist or is no longer available.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/mentors')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Back to Mentors
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable = mentor.profile?.mentorship?.currentMentees < mentor.profile?.mentorship?.maxMentees;

  if (!isAvailable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <HiXCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Mentor is at capacity</h3>
          <p className="mt-1 text-sm text-gray-500">
            This mentor has reached their maximum number of mentees.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/mentors')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Find Another Mentor
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
            onClick={() => navigate(`/mentors/${id}`)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <HiArrowLeft className="h-4 w-4 mr-1" />
            Back to Mentor Profile
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {mentor.profile?.profilePicture ? (
                  <img
                    className="h-16 w-16 rounded-full object-cover border-4 border-white"
                    src={mentor.profile.profilePicture}
                    alt={`${mentor.firstName} ${mentor.lastName}`}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center border-4 border-white">
                    <span className="text-lg font-medium text-green-600">
                      {mentor.firstName[0]}{mentor.lastName[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-white">
                <h1 className="text-2xl font-bold">
                  Request Mentorship from {mentor.firstName} {mentor.lastName}
                </h1>
                <p className="text-green-100">
                  {mentor.profile?.currentJob} at {mentor.profile?.company}
                </p>
                {mentor.profile?.mentorship?.mentorRating > 0 && (
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {renderStars(mentor.profile.mentorship.mentorRating)}
                    </div>
                    <span className="ml-2 text-green-100">
                      ({mentor.profile.mentorship.mentorRating.toFixed(1)})
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <div className="flex items-center text-green-100">
                  <HiCheckCircle className="h-5 w-5 mr-1" />
                  <span className="text-sm">Available</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Request Message */}
            <div>
              <label htmlFor="requestMessage" className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want this mentor? *
              </label>
              <textarea
                id="requestMessage"
                name="requestMessage"
                rows={4}
                value={formData.requestMessage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tell the mentor why you're interested in their guidance and what you hope to achieve..."
                required
              />
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are your goals? *
              </label>
              {formData.goals.map((goal, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => handleGoalChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={`Goal ${index + 1}`}
                  />
                  {formData.goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGoal(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addGoal}
                className="text-sm text-green-600 hover:text-green-800"
              >
                + Add another goal
              </button>
            </div>

            {/* Focus Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What areas would you like to focus on? * (Select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {focusAreaOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.focusAreas.includes(option.value)}
                      onChange={() => handleFocusAreaToggle(option.value)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="expectedDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Expected duration
              </label>
              <select
                id="expectedDuration"
                name="expectedDuration"
                value={formData.expectedDuration}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Meeting Frequency */}
            <div>
              <label htmlFor="meetingFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred meeting frequency
              </label>
              <select
                id="meetingFrequency"
                name="meetingFrequency"
                value={formData.meetingFrequency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Communication Method */}
            <div>
              <label htmlFor="communicationMethod" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred communication method
              </label>
              <select
                id="communicationMethod"
                name="communicationMethod"
                value={formData.communicationMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {communicationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(`/mentors/${id}`)}
                  className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending Request...' : 'Send Mentorship Request'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentorshipRequest;
