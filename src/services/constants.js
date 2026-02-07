// API Configuration
export const API_BASE_URL = 'https://100.96.18.81:7085/api';
//export const API_BASE_URL = 'https://localhost:7085/api';
// Cookie Names
export const COOKIE_REFRESH_TOKEN = 'X-Refresh-Token';

// LocalStorage Keys
export const STORAGE_TOKEN = 'token';
export const STORAGE_USER = 'user';
export const STORAGE_REFRESH_TOKEN = 'refreshToken';

// Permissions
export const PERMISSIONS = {
  HR_TIMEKEEPING_READ: 'HR_TIMEKEEPING.Read',
  HR_TIMEKEEPING_WRITE: 'HR_TIMEKEEPING.Write',
  SYSTEM_USERS_READ: 'SYSTEM_USERS.Read',
  SYSTEM_USERS_WRITE: 'SYSTEM_USERS.Write',
  SYSTEM_USERS_DELETE: 'SYSTEM_USERS.Delete',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'Quản trị viên',
  HR: 'Quản lý nhân sự',
  USER: 'Nhân viên',
};
