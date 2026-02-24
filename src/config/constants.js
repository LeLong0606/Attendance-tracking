/**
 * Config - Constants
 * Chứa các giá trị cấu hình dự án
 */

// API Configuration
 //const API_BASE_URL = '/api';
// Sẽ được proxy qua Vite dev server đến: 
export const API_BASE_URL ='https://100.96.18.81:7085/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/change-password',
  CHANGE_INITIAL_PASSWORD: '/auth/change-initial-password',
  
  // User
  GET_PROFILE: '/userProfile',

  UPDATE_PROFILE_ME: '/userProfile/me',
  
  // Payroll
  GET_SALARY_COMPONENTS: '/payroll/salary-structure/components',
  GET_USER_SALARY_STRUCTURE: '/payroll/salary-structure/user',
};

// LocalStorage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  REFRESH_TOKEN: 'refreshToken',
};

// Direct exports for backward compatibility
export const STORAGE_TOKEN = STORAGE_KEYS.TOKEN;
export const STORAGE_USER = STORAGE_KEYS.USER;
export const STORAGE_REFRESH_TOKEN = STORAGE_KEYS.REFRESH_TOKEN;

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

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

//Routes
export const ROUTES = {
  LOGIN:  '/' ,
  MAIN: '/main',  
  CHANGE_INIT_PASSWORD: '/change-init-password',
  ERROR : '/error',
};
