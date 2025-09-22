import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  HiStar, 
  HiLocationMarker, 
  HiBriefcase, 
  HiAcademicCap,
  HiUser,
  HiClock,
  HiChat,
  HiMail,
  HiPhone,
  HiGlobe,
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle
} from 'react-icons/hi';
import { mentorshipAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const MentorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMentorProfile();
  }, [id]);

  const loadMentorProfile = async () => {
    try {
      setLoading(true);
      const response = await mentorshipAPI.getMentor(id);
      setMentor(response.data.mentor);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading mentor profile:', error);
      toast.error('Failed to load mentor profile');
      navigate('/mentors');
    } finally {
      setLoading(false);
    }
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

  const getFrequencyLabel = (frequency) => {
    const labels = {
      'weekly': 'Weekly',
      'bi-weekly': 'Bi-weekly',
      'monthly': 'Monthly',
      'as-needed': 'As needed'
    };
    return labels[frequency] || frequency;
  };

  const getCommunicationLabel = (method) => {
    const labels = {
      'email': 'Email',
      'phone': 'Phone',
      'video-call': 'Video Call',
      'in-person': 'In Person',
      'mixed': 'Mixed'
    };
    return labels[method] || method;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<HiStar key={i} className="h-5 w-5 text-yellow-400 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<HiStar key="half" className="h-5 w-5 text-yellow-400 fill-current opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<HiStar key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
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
            <Link
              to="/mentors"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Back to Mentors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable = mentor.profile?.mentorship?.currentMentees < mentor.profile?.mentorship?.maxMentees;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/mentors"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <HiArrowLeft className="h-4 w-4 mr-1" />
            Back to Mentors
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {mentor.profile?.profilePicture ? (
                  <img
                    className="h-24 w-24 rounded-full object-cover border-4 border-white"
                    src={mentor.profile.profilePicture}
                    alt={`${mentor.firstName} ${mentor.lastName}`}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center border-4 border-white">
                    <span className="text-2xl font-medium text-blue-600">
                      {mentor.firstName[0]}{mentor.lastName[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold">
                  {mentor.firstName} {mentor.lastName}
                </h1>
                <p className="text-blue-100 text-lg">
                  {mentor.profile?.currentJob} at {mentor.profile?.company}
                </p>
                {mentor.profile?.location && (
                  <div className="flex items-center mt-2 text-blue-100">
                    <HiLocationMarker className="h-4 w-4 mr-1" />
                    {mentor.profile.location.city}, {mentor.profile.location.state}
                  </div>
                )}
                {mentor.profile?.mentorship?.mentorRating > 0 && (
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      {renderStars(mentor.profile.mentorship.mentorRating)}
                    </div>
                    <span className="ml-2 text-blue-100">
                      ({mentor.profile.mentorship.mentorRating.toFixed(1)})
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {isAvailable ? (
                  <div className="flex items-center text-green-100">
                    <HiCheckCircle className="h-5 w-5 mr-1" />
                    <span className="text-sm">Available</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-100">
                    <HiXCircle className="h-5 w-5 mr-1" />
                    <span className="text-sm">Full</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalMentees}</div>
                  <div className="text-sm text-gray-500">Total Mentees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalSessions}</div>
                  <div className="text-sm text-gray-500">Total Sessions</div>
                </div>
              </div>
            )}

            {/* Bio */}
            {mentor.profile?.mentorship?.mentorBio && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">About</h3>
                <p className="text-gray-600 leading-relaxed">
                  {mentor.profile.mentorship.mentorBio}
                </p>
              </div>
            )}

            {/* General Bio */}
            {mentor.profile?.bio && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Background</h3>
                <p className="text-gray-600 leading-relaxed">
                  {mentor.profile.bio}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                {/* Experience */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Experience</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <HiBriefcase className="h-5 w-5 mr-3 text-gray-400" />
                      <span>
                        {getExperienceLabel(mentor.profile?.mentorship?.mentorExperience || '2-5 years')} mentoring experience
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <HiUser className="h-5 w-5 mr-3 text-gray-400" />
                      <span>
                        {mentor.profile?.mentorship?.currentMentees || 0} of {mentor.profile?.mentorship?.maxMentees || 3} mentee slots filled
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <HiClock className="h-5 w-5 mr-3 text-gray-400" />
                      <span>
                        Prefers {getFrequencyLabel(mentor.profile?.mentorship?.preferredMeetingFrequency || 'monthly')} meetings
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <HiChat className="h-5 w-5 mr-3 text-gray-400" />
                      <span>
                        Communication via {getCommunicationLabel(mentor.profile?.mentorship?.preferredCommunicationMethod || 'mixed')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {mentor.profile?.skills && mentor.profile.skills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {mentor.profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div>
                {/* Specialties */}
                {mentor.profile?.mentorship?.mentorSpecialties && mentor.profile.mentorship.mentorSpecialties.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Mentorship Specialties</h3>
                    <div className="space-y-2">
                      {mentor.profile.mentorship.mentorSpecialties.map((specialty) => (
                        <div key={specialty} className="flex items-center">
                          <HiCheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-gray-600">{getSpecialtyLabel(specialty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {mentor.profile?.graduationYear && mentor.profile?.degree && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Education</h3>
                    <div className="flex items-center text-gray-600">
                      <HiAcademicCap className="h-5 w-5 mr-3 text-gray-400" />
                      <span>
                        {mentor.profile.degree} in {mentor.profile.major} ({mentor.profile.graduationYear})
                      </span>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Contact</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <HiMail className="h-4 w-4 mr-3 text-gray-400" />
                      <span>{mentor.email}</span>
                    </div>
                    {mentor.profile?.phone && (
                      <div className="flex items-center text-gray-600">
                        <HiPhone className="h-4 w-4 mr-3 text-gray-400" />
                        <span>{mentor.profile.phone}</span>
                      </div>
                    )}
                    {mentor.profile?.website && (
                      <div className="flex items-center text-gray-600">
                        <HiGlobe className="h-4 w-4 mr-3 text-gray-400" />
                        <a
                          href={mentor.profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {mentor.profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {user?.role === 'student' && isAvailable ? (
                  <Link
                    to={`/mentors/${mentor._id}/request`}
                    className="flex-1 bg-green-600 text-white text-center py-3 px-6 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Request Mentorship
                  </Link>
                ) : user?.role === 'student' && !isAvailable ? (
                  <button
                    disabled
                    className="flex-1 bg-gray-400 text-white text-center py-3 px-6 rounded-md text-sm font-medium cursor-not-allowed"
                  >
                    Mentor is at capacity
                  </button>
                ) : (
                  <Link
                    to="/mentors"
                    className="flex-1 bg-blue-600 text-white text-center py-3 px-6 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    View All Mentors
                  </Link>
                )}
                <Link
                  to="/mentors"
                  className="flex-1 bg-white text-gray-700 text-center py-3 px-6 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Back to Directory
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
