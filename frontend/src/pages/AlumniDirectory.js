import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { usersAPI } from '../services/api';
import { 
  HiSearch, 
  HiFilter, 
  HiUser, 
  HiMail, 
  HiPhone, 
  HiLocationMarker, 
  HiAcademicCap, 
  HiBriefcase, 
  HiGlobe, 
  HiX,
  HiChevronLeft,
  HiChevronRight,
  HiEye
} from 'react-icons/hi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RoleGuard from '../components/common/RoleGuard';

const AlumniDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    graduationYear: '',
    degree: '',
    location: '',
    company: '',
    skills: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Fetch alumni data
  const { data: alumniData, isLoading, error } = useQuery(
    ['alumni', currentPage, searchTerm, filters],
    async () => {
      // Create query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        role: 'alumni',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.graduationYear && { graduationYear: filters.graduationYear }),
        ...(filters.degree && { degree: filters.degree }),
        ...(filters.location && { location: filters.location }),
        ...(filters.company && { company: filters.company }),
        ...(filters.skills && { skills: filters.skills }),
      });

      // Make API call to alumni directory endpoint
      const response = await fetch(`http://localhost:5001/api/users/alumni/directory?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alumni');
      }
      return response.json();
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        console.log('Alumni API Success:', data);
      },
      onError: (error) => {
        console.error('Alumni API Error:', error);
      }
    }
  );

  const alumni = alumniData?.users || [];
  const totalPages = Math.ceil((alumniData?.total || 0) / itemsPerPage);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      graduationYear: '',
      degree: '',
      location: '',
      company: '',
      skills: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      student: { color: 'bg-blue-100 text-blue-800', label: 'Student' },
      alumni: { color: 'bg-green-100 text-green-800', label: 'Alumni' },
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      super_admin: { color: 'bg-red-100 text-red-800', label: 'Super Admin' }
    };
    
    const config = roleConfig[role];
    if (!config) return null;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const AlumniCard = ({ alumni }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {alumni.profile?.profilePicture ? (
              <img
                src={alumni.profile.profilePicture}
                alt={`${alumni.firstName} ${alumni.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <HiUser className="h-8 w-8 text-gray-400" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {alumni.firstName} {alumni.lastName}
            </h3>
            {getRoleBadge(alumni.role)}
          </div>
          
          {alumni.profile?.currentJob && (
            <p className="text-sm text-gray-600 mt-1">
              <HiBriefcase className="h-4 w-4 inline mr-1" />
              {alumni.profile.currentJob}
            </p>
          )}
          
          {alumni.profile?.company && (
            <p className="text-sm text-gray-600">
              at {alumni.profile.company}
            </p>
          )}

          {alumni.profile?.graduationYear && (
            <p className="text-sm text-gray-500 mt-2">
              <HiAcademicCap className="h-4 w-4 inline mr-1" />
              Class of {alumni.profile.graduationYear}
            </p>
          )}

          {alumni.profile?.location?.city && (
            <p className="text-sm text-gray-500">
              <HiLocationMarker className="h-4 w-4 inline mr-1" />
              {alumni.profile.location.city}, {alumni.profile.location.state}
            </p>
          )}

          {alumni.profile?.skills && alumni.profile.skills.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {alumni.profile.skills.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {skill}
                  </span>
                ))}
                {alumni.profile.skills.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{alumni.profile.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setSelectedAlumni(alumni)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <HiEye className="h-3 w-3 mr-1" />
              View Profile
            </button>
            {alumni.profile?.linkedin && (
              <a
                href={alumni.profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <HiGlobe className="h-3 w-3 mr-1" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const AlumniModal = ({ alumni, onClose }) => {
    if (!alumni) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {alumni.firstName} {alumni.lastName}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Picture and Basic Info */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {alumni.profile?.profilePicture ? (
                      <img
                        src={alumni.profile.profilePicture}
                        alt={`${alumni.firstName} ${alumni.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <HiUser className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-xl font-semibold text-gray-900">
                      {alumni.firstName} {alumni.lastName}
                    </h4>
                    {getRoleBadge(alumni.role)}
                  </div>
                  {alumni.profile?.bio && (
                    <p className="text-gray-600">{alumni.profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h5>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <HiMail className="h-4 w-4 mr-2" />
                    {alumni.email}
                  </div>
                  {alumni.profile?.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <HiPhone className="h-4 w-4 mr-2" />
                      {alumni.profile.phone}
                    </div>
                  )}
                  {alumni.profile?.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <HiLocationMarker className="h-4 w-4 mr-2" />
                      {alumni.profile.location.city}, {alumni.profile.location.state}, {alumni.profile.location.country}
                    </div>
                  )}
                  {alumni.profile?.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <HiGlobe className="h-4 w-4 mr-2" />
                      <a href={alumni.profile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                        {alumni.profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Education */}
              {(alumni.profile?.graduationYear || alumni.profile?.degree || alumni.profile?.major) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Education</h5>
                  <div className="space-y-2">
                    {alumni.profile?.graduationYear && (
                      <div className="flex items-center text-sm text-gray-600">
                        <HiAcademicCap className="h-4 w-4 mr-2" />
                        Class of {alumni.profile.graduationYear}
                      </div>
                    )}
                    {alumni.profile?.degree && (
                      <div className="text-sm text-gray-600">
                        {alumni.profile.degree}
                      </div>
                    )}
                    {alumni.profile?.major && (
                      <div className="text-sm text-gray-600">
                        {alumni.profile.major}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Career */}
              {(alumni.profile?.currentJob || alumni.profile?.company) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Career</h5>
                  <div className="space-y-2">
                    {alumni.profile?.currentJob && (
                      <div className="flex items-center text-sm text-gray-600">
                        <HiBriefcase className="h-4 w-4 mr-2" />
                        {alumni.profile.currentJob}
                      </div>
                    )}
                    {alumni.profile?.company && (
                      <div className="text-sm text-gray-600">
                        at {alumni.profile.company}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {alumni.profile?.skills && alumni.profile.skills.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {alumni.profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {alumni.profile?.interests && alumni.profile.interests.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Interests</h5>
                  <div className="flex flex-wrap gap-2">
                    {alumni.profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div className="flex space-x-4">
                {alumni.profile?.linkedin && (
                  <a
                    href={alumni.profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <HiGlobe className="h-4 w-4 mr-2" />
                    LinkedIn
                  </a>
                )}
                <button
                  onClick={() => {
                    // This would open a message modal or redirect to messages
                    console.log('Start conversation with', alumni._id);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <HiMail className="h-4 w-4 mr-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error loading alumni</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alumni Directory</h1>
          <p className="mt-2 text-gray-600">
            Connect with fellow alumni and expand your professional network
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search alumni by name, company, skills..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <HiFilter className="h-4 w-4 mr-2" />
                  Filters
                </button>
                {(searchTerm || Object.values(filters).some(f => f)) && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 2020"
                      value={filters.graduationYear}
                      onChange={(e) => handleFilterChange('graduationYear', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Degree
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., B.Tech, MBA"
                      value={filters.degree}
                      onChange={(e) => handleFilterChange('degree', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., New York"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Google"
                      value={filters.company}
                      onChange={(e) => handleFilterChange('company', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., JavaScript"
                      value={filters.skills}
                      onChange={(e) => handleFilterChange('skills', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {alumni.length} of {alumniData?.total || 0} alumni
          </p>
        </div>

        {/* Alumni Grid */}
        {alumni.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-12 text-center">
              <HiUser className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No alumni found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {alumni.map((alumni) => (
                <AlumniCard key={alumni._id} alumni={alumni} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HiChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNum
                                ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HiChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Alumni Modal */}
        <AlumniModal alumni={selectedAlumni} onClose={() => setSelectedAlumni(null)} />
      </div>
    </div>
  );
};

export default AlumniDirectory;
