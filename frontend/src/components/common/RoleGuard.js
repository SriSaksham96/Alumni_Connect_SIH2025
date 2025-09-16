import React from 'react';
import { useAuth } from '../../context/AuthContext';

const RoleGuard = ({ 
  children, 
  requiredPermission = null,
  requiredRoles = null,
  adminOnly = false,
  superAdminOnly = false,
  alumniOnly = false,
  studentOnly = false,
  fallback = null,
  showFallback = true
}) => {
  const { 
    hasPermission, 
    hasRole, 
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isAlumni,
    isStudent
  } = useAuth();

  // Check specific permissions
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return showFallback ? fallback : null;
  }

  // Check specific roles
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return showFallback ? fallback : null;
  }

  // Legacy role checks
  if (adminOnly && !isAdmin()) {
    return showFallback ? fallback : null;
  }

  if (superAdminOnly && !isSuperAdmin()) {
    return showFallback ? fallback : null;
  }

  if (alumniOnly && !isAlumni()) {
    return showFallback ? fallback : null;
  }

  if (studentOnly && !isStudent()) {
    return showFallback ? fallback : null;
  }

  return children;
};

export default RoleGuard;
