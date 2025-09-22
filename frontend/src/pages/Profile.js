import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { 
  HiUser, 
  HiMail, 
  HiAcademicCap, 
  HiBriefcase, 
  HiPencil, 
  HiSave, 
  HiX,
  HiCamera,
  HiDocument,
  HiPlus,
  HiTrash,
  HiBookOpen
} from 'react-icons/hi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        bio: user.profile?.bio || '',
        graduationYear: user.profile?.graduationYear || '',
        degree: user.profile?.degree || '',
        major: user.profile?.major || '',
        currentJob: user.profile?.currentJob || '',
        company: user.profile?.company || '',
        website: user.profile?.website || '',
        linkedin: user.profile?.linkedin || '',
        city: user.profile?.location?.city || '',
        state: user.profile?.location?.state || '',
        country: user.profile?.location?.country || '',
        skills: user.profile?.skills?.join(', ') || '',
        interests: user.profile?.interests?.join(', ') || '',
        // Mentorship fields
        isAvailableAsMentor: user.profile?.mentorship?.isAvailableAsMentor || false,
        mentorBio: user.profile?.mentorship?.mentorBio || '',
        mentorExperience: user.profile?.mentorship?.mentorExperience || '2-5 years',
        maxMentees: user.profile?.mentorship?.maxMentees || 3,
        preferredMeetingFrequency: user.profile?.mentorship?.preferredMeetingFrequency || 'monthly',
        preferredCommunicationMethod: user.profile?.mentorship?.preferredCommunicationMethod || 'mixed'
      });
      setDocuments(user.profile?.documents || []);
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const processedData = {
        ...data,
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        interests: data.interests ? data.interests.split(',').map(s => s.trim()).filter(s => s) : [],
        location: {
          city: data.city,
          state: data.state,
          country: data.country
        }
      };

      delete processedData.city;
      delete processedData.state;
      delete processedData.country;

      const response = await usersAPI.updateUser(user._id, processedData);
      
      if (response.success) {
        updateUser(response.user);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = () => {
    if (!user) return null;
    
    const roleConfig = {
      student: { color: 'bg-blue-100 text-blue-800', label: 'Student' },
      alumni: { color: 'bg-green-100 text-green-800', label: 'Alumni' },
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      super_admin: { color: 'bg-red-100 text-red-800', label: 'Super Admin' }
    };
    
    const config = roleConfig[user.role];
    if (!config) return null;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: HiUser },
    { id: 'education', name: 'Education', icon: HiAcademicCap },
    { id: 'career', name: 'Career', icon: HiBriefcase },
    { id: 'contact', name: 'Contact', icon: HiMail },
    { id: 'documents', name: 'Documents', icon: HiDocument },
    { id: 'mentorship', name: 'Mentorship', icon: HiBookOpen }
  ];

  if (loading && !isSubmitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user?.profile?.profilePicture ? (
                      <img
                        src={user.profile.profilePicture}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <HiUser className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-primary-600 text-white rounded-full p-1 cursor-pointer hover:bg-primary-700">
                    <HiCamera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-gray-600">{user?.email}</p>
                  <div className="mt-2">
                    {getRoleBadge()}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <HiX className="h-4 w-4 mr-2 inline" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      <HiSave className="h-4 w-4 mr-2 inline" />
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                  >
                    <HiPencil className="h-4 w-4 mr-2 inline" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      {...register('bio')}
                      disabled={!isEditing}
                      rows={4}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.bio ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Education Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
                    <input
                      {...register('graduationYear')}
                      type="number"
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.graduationYear ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Degree</label>
                    <input
                      {...register('degree')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.degree ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="e.g., B.Tech, MBA"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Major/Field of Study</label>
                    <input
                      {...register('major')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.major ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="e.g., Computer Science, Business Administration"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'career' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Career Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Job Title</label>
                    <input
                      {...register('currentJob')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.currentJob ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <input
                      {...register('company')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.company ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="e.g., Google, Microsoft"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Skills</label>
                    <input
                      {...register('skills')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.skills ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="e.g., JavaScript, Python, React (comma-separated)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Interests</label>
                    <input
                      {...register('interests')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.interests ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="e.g., Technology, Sports, Music (comma-separated)"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      {...register('phone')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      {...register('city')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State/Province</label>
                    <input
                      {...register('state')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.state ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      {...register('country')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.country ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="United States"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      {...register('website')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.website ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                    <input
                      {...register('linkedin')}
                      disabled={!isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                        errors.linkedin ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                  <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer">
                    <HiPlus className="h-4 w-4 mr-2" />
                    Upload Documents
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </label>
                </div>
                
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <HiDocument className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by uploading a document.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <HiDocument className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setDocuments(documents.filter(d => d._id !== doc._id))}
                            className="text-red-600 hover:text-red-800"
                          >
                            <HiTrash className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-800"
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mentorship' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Mentorship Preferences</h3>
                  {user?.role === 'alumni' && (
                    <span className="text-sm text-gray-500">
                      Available to mentor students
                    </span>
                  )}
                </div>

                {user?.role === 'alumni' ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Available as Mentor */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isAvailableAsMentor"
                        {...register('isAvailableAsMentor')}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isAvailableAsMentor" className="ml-2 block text-sm text-gray-900">
                        I am available as a mentor
                      </label>
                    </div>

                    {/* Mentor Bio */}
                    <div>
                      <label htmlFor="mentorBio" className="block text-sm font-medium text-gray-700">
                        Mentor Bio
                      </label>
                      <textarea
                        id="mentorBio"
                        rows={4}
                        {...register('mentorBio')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Tell students about your experience and how you can help them..."
                      />
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label htmlFor="mentorExperience" className="block text-sm font-medium text-gray-700">
                        Mentoring Experience
                      </label>
                      <select
                        id="mentorExperience"
                        {...register('mentorExperience')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="0-2 years">0-2 years</option>
                        <option value="2-5 years">2-5 years</option>
                        <option value="5-10 years">5-10 years</option>
                        <option value="10+ years">10+ years</option>
                      </select>
                    </div>

                    {/* Max Mentees */}
                    <div>
                      <label htmlFor="maxMentees" className="block text-sm font-medium text-gray-700">
                        Maximum Number of Mentees
                      </label>
                      <select
                        id="maxMentees"
                        {...register('maxMentees', { valueAsNumber: true })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                        <option value={6}>6</option>
                        <option value={7}>7</option>
                        <option value={8}>8</option>
                        <option value={9}>9</option>
                        <option value={10}>10</option>
                      </select>
                    </div>

                    {/* Meeting Frequency */}
                    <div>
                      <label htmlFor="preferredMeetingFrequency" className="block text-sm font-medium text-gray-700">
                        Preferred Meeting Frequency
                      </label>
                      <select
                        id="preferredMeetingFrequency"
                        {...register('preferredMeetingFrequency')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="as-needed">As needed</option>
                      </select>
                    </div>

                    {/* Communication Method */}
                    <div>
                      <label htmlFor="preferredCommunicationMethod" className="block text-sm font-medium text-gray-700">
                        Preferred Communication Method
                      </label>
                      <select
                        id="preferredCommunicationMethod"
                        {...register('preferredCommunicationMethod')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="video-call">Video Call</option>
                        <option value="in-person">In Person</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <HiSave className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12">
                    <HiBookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Mentorship not available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Only alumni can become mentors. Students can find mentors in the mentor directory.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
