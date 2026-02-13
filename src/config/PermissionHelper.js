/**
 * PermissionHelper
 * Kiểm tra quyền và rol của người dùng
 */
import { getUserFromToken } from './TokenHelper';
import { USER_ROLES, PERMISSIONS } from './constants';

/**
 * Kiểm tra user có quyền cụ thể không
 * @param {string} permission - Quyền cần kiểm tra
 * @returns {boolean}
 */
export const hasPermission = (permission) => {
  const user = getUserFromToken();
  if (!user) return false;
  return user.hasPermission(permission);
};

/**
 * Kiểm tra user là Admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  const user = getUserFromToken();
  if (!user) return false;
  return user.isAdmin();
};

/**
 * Kiểm tra user có quyền HR không
 * @returns {boolean}
 */
export const hasHRAccess = () => {
  return hasPermission(PERMISSIONS.HR_TIMEKEEPING_READ);
};

/**
 * Lấy vai trò (role) của user
 * @returns {string|null} Vai trò hoặc null
 */
export const getUserRole = () => {
  const user = getUserFromToken();
  if (!user) return null;

  // Kiểm tra là Admin
  if (isAdmin()) {
    return USER_ROLES.ADMIN;
  }

  // Kiểm tra là HR
  // if (hasHRAccess()) {
  //   return USER_ROLES.HR;
  // }

  // Mặc định là User (Nhân viên)
  return USER_ROLES.USER;
};
