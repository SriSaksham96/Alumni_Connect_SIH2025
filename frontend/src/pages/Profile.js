import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
            <div className="text-center py-12">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Welcome, {user?.firstName} {user?.lastName}!
              </h2>
              <p className="text-gray-600">
                Profile management features coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
