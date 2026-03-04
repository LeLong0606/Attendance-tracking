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
 * Kiểm tra user là Admin (có SYSTEM_USERS.Write)
 * @returns {boolean}
 */
export const isAdmin = () => {
  return hasPermission(PERMISSIONS.SYSTEM_USERS_WRITE);
};

/**
 * Kiểm tra user là HR (có SYSTEM_USERS.Read nhưng không phải admin)
 * @returns {boolean}
 */
export const isHR = () => {
  return hasPermission(PERMISSIONS.SYSTEM_USERS_READ) && !isAdmin();
};

/**
 * Kiểm tra user có quyền HR không (có SYSTEM_USERS.Read)
 * @returns {boolean}
 */
export const hasHRAccess = () => {
  return hasPermission(PERMISSIONS.SYSTEM_USERS_READ);
};

/**
 * Kiểm tra user có quyền Dashboard không (chỉ admin)
 * @returns {boolean}
 */
export const hasDashboardAccess = () => {
  return isAdmin();
};

/**
 * Kiểm tra user có quyền manage account không (chỉ admin)
 * @returns {boolean}
 */
export const hasManageAccountAccess = () => {
  return isAdmin();
};

/**
 * Kiểm tra user có quyền nhập ngày công không (Admin hoặc HR - những người có SYSTEM_USERS.Read)
 * @returns {boolean}
 */
export const hasInputWorkDayAccess = () => {
  return hasPermission(PERMISSIONS.SYSTEM_USERS_READ);
};

/**
 * Kiểm tra user có quyền xem ngày công không (tất cả - có HR_TIMEKEEPING.Read hoặc không có permission nào)
 * @returns {boolean}
 */
export const hasViewWorkDayAccess = () => {
  const user = getUserFromToken();
  // Nếu user không có permissions, mặc định cho phép xem
  if (!user || !user.permissions || user.permissions.length === 0) {
    return true;
  }
  return hasPermission(PERMISSIONS.HR_TIMEKEEPING_READ);
};

/**
 * Lấy vai trò (role) của user
 * @returns {string|null} Vai trò hoặc null
 */
export const getUserRole = () => {
  const user = getUserFromToken();
  if (!user) return null;

  // Nếu user không có permissions hoặc permissions rỗng, mặc định là User
  if (!user.permissions || !Array.isArray(user.permissions) || user.permissions.length === 0) {
    return USER_ROLES.USER;
  }

  // Kiểm tra là Admin
  if (isAdmin()) {
    return USER_ROLES.ADMIN;
  }

  // Kiểm tra là HR
  if (isHR()) {
    return USER_ROLES.HR;
  }

  // Mặc định là User (Nhân viên)
  return USER_ROLES.USER;
};
