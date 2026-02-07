import { getUserFromToken } from './auth';
import { PERMISSIONS, USER_ROLES } from './constants';

// Check if user has specific permission
export const hasPermission = (permission) => {
  const user = getUserFromToken();
  if (!user) return false;
  
  const permissions = user.permissions;
  if (Array.isArray(permissions)) {
    return permissions.includes(permission);
  } else if (typeof permissions === 'string') {
    return permissions === permission;
  }
  return false;
};

// Check if user is admin (has full access)
export const isAdmin = () => {
  const user = getUserFromToken();
  if (!user) return false;
  
  // Admin check: username is "Admin" or has system-level permissions
  return (
    user.username?.toLowerCase() === 'admin' ||
    (Array.isArray(user.permissions) && 
     user.permissions.some(p => p.startsWith('SYSTEM_')))
  );
};

// Check if user has HR timekeeping access
export const hasHRAccess = () => {
  return hasPermission(PERMISSIONS.HR_TIMEKEEPING_READ);
};

// Get user role/type based on permissions
export const getUserRole = () => {
  const user = getUserFromToken();
  if (!user) return null;
  
  // Check if admin
  if (isAdmin()) {
    return USER_ROLES.ADMIN;
  }
  
  // Check if HR user
  if (hasHRAccess()) {
    return USER_ROLES.HR;
  }
  
  // Default to user
  return USER_ROLES.USER;
};

// Get accessible features based on user permissions
export const getAccessibleFeatures = () => {
  const role = getUserRole();
  
  const features = {
    admin: [
      'manageProfile',      // Tạo tài khoản người dùng
      'inputWorkDay',       // Nhập ngày công
      'viewWorkDayTable',   // Xem bảng chấm công
      'manageAccount',      // Quản lý tài khoản
      'editProfile',        // Chỉnh sửa profile
    ],
    hr: [
      'viewWorkDayTable',   // Chỉ được xem bảng chấm công
    ],
    user: [
      'viewWorkDayTable',   // Chỉ được xem bảng chấm công
    ],
  };
  
  return features[role] || [];
};
