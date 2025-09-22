import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HiSearch, 
  HiFilter, 
  HiLocationMarker, 
  HiStar, 
  HiUser, 
  HiBriefcase,
  HiAcademicCap,
  HiClock,
  HiChat,
  HiEye
} from 'react-icons/hi';
import { mentorshipAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const MentorDirectory = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    specialties: [],
    experience: '',
    location: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalMentors: 0
  });

  const specialtyOptions = [
    'career-guidance',
    'skill-development', 
    'networking',
    'industry-insights',
    'resume-review',
    'interview-prep',
    'entrepreneurship',
    'leadership',
    'work-life-balance',
    'other'
  ];

  const experienceOptions = [
    '0-2 years',
    '2-5 years', 
    '5-10 years',
    '10+ years'
  ];

  useEffect(() => {
    loadMentors();
  }, [filters, pagination.currentPage]);

  const loadMentors = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: 12,
        ...filters
      };

      // Convert specialties array to query string
      if (filters.specialties.length > 0) {
        params.specialties = filters.specialties;
      }

      const response = await mentorshipAPI.getMentors(params);
      setMentors(response.data.mentors);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading mentors:', error);
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handleSpecialtyToggle = (specialty) => {
    setFilters(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      specialties: [],
      experience: '',
      location: ''
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const getSpecialtyLabel = (specialty) => {
    const labels = {
      'career-guidance': 'Career Guidance',
      'skill-development': 'Skill Development',
      'networking': 'Networking',
      'industry-insights': 'Industry Insights',
      'resume-review': 'Resume Review',
      'interview-prep': 'Interview Prep',
      'entrepreneurship': 'Entrepreneurship',
      'leadership': 'Leadership',
      'work-life-balance': 'Work-Life Balance',
      'other': 'Other'
    };
    return labels[specialty] || specialty;
  };

  const getExperienceLabel = (experience) => {
    const labels = {
      '0-2 years': '0-2 Years',
      '2-5 years': '2-5 Years',
      '5-10 years': '5-10 Years',
      '10+ years': '10+ Years'
    };
    return labels[experience] || experience;
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find a Mentor</h1>
          <p className="mt-2 text-gray-600">
            Connect with experienced alumni who can guide your career journey
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filter Mentors</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name, skills, or bio..."
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <div className="relative">
                <HiLocationMarker className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, state, or country"
                />
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All levels</option>
                {experienceOptions.map(exp => (
                  <option key={exp} value={exp}>
                    {getExperienceLabel(exp)}
                  </option>
                ))}
              </select>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialties
              </label>
              <div className="flex flex-wrap gap-1">
                {specialtyOptions.slice(0, 3).map(specialty => (
                  <button
                    key={specialty}
                    onClick={() => handleSpecialtyToggle(specialty)}
                    className={`px-2 py-1 text-xs rounded-full ${
                      filters.specialties.includes(specialty)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {getSpecialtyLabel(specialty)}
                  </button>
                ))}
                {filters.specialties.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{filters.specialties.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Specialty Tags */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              All Specialties
            </label>
            <div className="flex flex-wrap gap-2">
              {specialtyOptions.map(specialty => (
                <button
                  key={specialty}
                  onClick={() => handleSpecialtyToggle(specialty)}
                  className={`px-3 py-1 text-sm rounded-full border ${
                    filters.specialties.includes(specialty)
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {getSpecialtyLabel(specialty)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found {pagination.totalMentors} mentors
            {filters.search && ` matching "${filters.search}"`}
          </p>
        </div>

        {/* Mentors Grid */}
        {mentors.length === 0 ? (
          <div className="text-center py-12">
            <HiUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No mentors found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div key={mentor._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Mentor Header */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {mentor.profile?.profilePicture ? (
                        <img
                          className="h-16 w-16 rounded-full object-cover"
                          src={mentor.profile.profilePicture}
                          alt={`${mentor.firstName} ${mentor.lastName}`}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-600">
                            {mentor.firstName[0]}{mentor.lastName[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900">
                        {mentor.firstName} {mentor.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {mentor.profile?.currentJob} at {mentor.profile?.company}
                      </p>
                      {mentor.profile?.mentorship?.mentorRating > 0 && (
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {renderStars(mentor.profile.mentorship.mentorRating)}
                          </div>
                          <span className="ml-1 text-sm text-gray-500">
                            ({mentor.profile.mentorship.mentorRating.toFixed(1)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {mentor.profile?.location && (
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <HiLocationMarker className="h-4 w-4 mr-1" />
                      {mentor.profile.location.city}, {mentor.profile.location.state}
                    </div>
                  )}

                  {/* Experience */}
                  {mentor.profile?.mentorship?.mentorExperience && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <HiBriefcase className="h-4 w-4 mr-1" />
                      {getExperienceLabel(mentor.profile.mentorship.mentorExperience)} experience
                    </div>
                  )}

                  {/* Bio */}
                  {mentor.profile?.mentorship?.mentorBio && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                      {mentor.profile.mentorship.mentorBio}
                    </p>
                  )}

                  {/* Specialties */}
                  {mentor.profile?.mentorship?.mentorSpecialties && mentor.profile.mentorship.mentorSpecialties.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {mentor.profile.mentorship.mentorSpecialties.slice(0, 3).map((specialty) => (
                          <span
                            key={specialty}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {getSpecialtyLabel(specialty)}
                          </span>
                        ))}
                        {mentor.profile.mentorship.mentorSpecialties.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{mentor.profile.mentorship.mentorSpecialties.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {mentor.profile?.skills && mentor.profile.skills.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {mentor.profile.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {skill}
                          </span>
                        ))}
                        {mentor.profile.skills.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{mentor.profile.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <HiUser className="h-4 w-4 mr-1" />
                      {mentor.profile?.mentorship?.currentMentees || 0}/{mentor.profile?.mentorship?.maxMentees || 3} mentees
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <HiClock className="h-4 w-4 mr-1" />
                      {mentor.profile?.mentorship?.preferredMeetingFrequency || 'monthly'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 px-6 py-3 flex space-x-3">
                  <Link
                    to={`/mentors/${mentor._id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/mentors/${mentor._id}/request`}
                    className="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Request Mentorship
                  </Link>
                </div>
              </div>
            ))}
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

export default MentorDirectory;
