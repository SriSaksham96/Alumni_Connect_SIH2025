import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { HiX, HiUser, HiSearch } from 'react-icons/hi';
import { usersAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const NewMessageModal = ({ isOpen, onClose, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: alumniData, isLoading } = useQuery(
    ['alumni', { search: searchTerm }],
    () => usersAPI.getAlumniDirectory({ search: searchTerm, limit: 20 }),
    {
      enabled: isOpen && searchTerm.length > 0,
      staleTime: 5 * 60 * 1000,
    }
  );

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleConfirm = () => {
    if (selectedUser) {
      onSelectUser(selectedUser);
      onClose();
      setSelectedUser(null);
      setSearchTerm('');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedUser(null);
    setSearchTerm('');
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClose}></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">New Message</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search alumni..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {searchTerm.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HiSearch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Start typing to search for alumni</p>
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : alumniData?.data?.alumni?.length > 0 ? (
                <div className="space-y-2">
                  {alumniData.data.alumni.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleUserSelect(user)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUser?._id === user._id
                          ? 'bg-primary-50 border-2 border-primary-200'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {user.profile?.profilePicture ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.profile.profilePicture}
                            alt={user.firstName}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <HiUser className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </h4>
                          {user.profile?.currentJob && (
                            <p className="text-sm text-gray-600 truncate">
                              {user.profile.currentJob}
                            </p>
                          )}
                          {user.profile?.graduationYear && (
                            <p className="text-xs text-gray-500">
                              Class of {user.profile.graduationYear}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No alumni found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedUser}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Conversation
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMessageModal;
