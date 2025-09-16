import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  adminOnly = false, 
  superAdminOnly = false,
  alumniOnly = false,
  studentOnly = false,
  requiredPermission = null,
  requiredRoles = null,
  fallbackPath = "/"
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    hasPermission, 
    hasRole, 
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isAlumni,
    isStudent
  } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check specific permissions
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check specific roles
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Legacy role checks
  if (adminOnly && !isAdmin()) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (superAdminOnly && !isSuperAdmin()) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (alumniOnly && !isAlumni()) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (studentOnly && !isStudent()) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
