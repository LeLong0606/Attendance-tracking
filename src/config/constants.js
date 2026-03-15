/**
 * Config - Constants
 * Chứa các giá trị cấu hình dự án
 */

// API Configuration
 //const API_BASE_URL = '/api';
// Sẽ được proxy qua Vite dev server đến: 
export const API_BASE_URL ='https://desktop-8l98oc0.tail542363.ts.net/workdaymanagement/api';





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

// Error Message Translations
export const ERROR_MESSAGE_TRANSLATIONS = {
  'Network error': 'Lỗi kết nối mạng',
  'network error': 'Lỗi kết nối mạng',
  'Unsupported protocol': 'URL không hợp lệ',
  'Failed to fetch': 'Lỗi kết nối tới máy chủ',
  'Unauthorized - Token expired': 'Phiên làm việc đã hết hạn',
  'token expired': 'Phiên làm việc đã hết hạn',
  '401': 'Không có quyền truy cập',
  '400': 'Dữ liệu không hợp lệ',
  '403': 'Bạn không có quyền truy cập',
  '404': 'Không tìm thấy dữ liệu',
  '500': 'Lỗi máy chủ',
  '503': 'Dịch vụ tạm không khả dụng',
};

// Hàm dịch message
export const translateErrorMessage = (error) => {
  if (!error) return 'Lỗi hệ thống. Vui lòng thử lại sau.';

  const fieldNameMap = {
    NewPassword: 'Mật khẩu mới',
    ConfirmNewPassword: 'Xác nhận mật khẩu mới',
    OldPassword: 'Mật khẩu cũ',
    Username: 'Tên đăng nhập',
    Password: 'Mật khẩu',
    FullName: 'Họ và tên',
    Email: 'Email',
    PhoneNumber: 'Số điện thoại',
    DateOfBirth: 'Ngày sinh',
    Gender: 'Giới tính',
  };

  const formatValidationErrors = (errors) => {
    if (!errors || typeof errors !== 'object') return '';

    return Object.entries(errors)
      .flatMap(([field, messages]) => {
        const label = fieldNameMap[field] || field;
        const messageList = Array.isArray(messages) ? messages : [messages];
        return messageList
          .filter(Boolean)
          .map((msg) => `${label}: ${msg}`);
      })
      .join('\n');
  };

  const errorPayload = error?.response?.data || error?.data || error;
  const validationDetail = formatValidationErrors(errorPayload?.errors);
  if (validationDetail) {
    const baseMessage = errorPayload?.message || 'Dữ liệu đầu vào không hợp lệ.';
    return `${baseMessage}\n${validationDetail}`;
  }
  
  const errorString = error.toString ? error.toString() : String(error);
  const errorMessage = error.message ? error.message : errorString;
  
  // Check for specific error patterns
  for (const [key, translation] of Object.entries(ERROR_MESSAGE_TRANSLATIONS)) {
    if (errorString.includes(key) || errorMessage.includes(key)) {
      return `${translation}: ${errorMessage}`;
    }
  }
  
  // trả về message gốc nếu không có pattern nào khớp, hoặc nếu message đã là tiếng Việt
  return errorMessage || 'Lỗi hệ thống. Vui lòng thử lại sau.';
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
  // CONTENT_COMMENTS
  CONTENT_COMMENTS_READ: 'CONTENT_COMMENTS.Read',
  CONTENT_COMMENTS_WRITE: 'CONTENT_COMMENTS.Write',
  CONTENT_COMMENTS_DELETE: 'CONTENT_COMMENTS.Delete',
  CONTENT_COMMENTS_EXPORT: 'CONTENT_COMMENTS.Export',
  CONTENT_COMMENTS_IMPORT: 'CONTENT_COMMENTS.Import',
  CONTENT_COMMENTS_APPROVE: 'CONTENT_COMMENTS.Approve',
  CONTENT_COMMENTS_EXECUTE: 'CONTENT_COMMENTS.Execute',
  
  // CONTENT_POSTS
  CONTENT_POSTS_READ: 'CONTENT_POSTS.Read',
  CONTENT_POSTS_WRITE: 'CONTENT_POSTS.Write',
  CONTENT_POSTS_DELETE: 'CONTENT_POSTS.Delete',
  CONTENT_POSTS_EXPORT: 'CONTENT_POSTS.Export',
  CONTENT_POSTS_IMPORT: 'CONTENT_POSTS.Import',
  CONTENT_POSTS_APPROVE: 'CONTENT_POSTS.Approve',
  CONTENT_POSTS_EXECUTE: 'CONTENT_POSTS.Execute',
  
  // REPORT_ANALYTICS
  REPORT_ANALYTICS_READ: 'REPORT_ANALYTICS.Read',
  REPORT_ANALYTICS_WRITE: 'REPORT_ANALYTICS.Write',
  REPORT_ANALYTICS_DELETE: 'REPORT_ANALYTICS.Delete',
  REPORT_ANALYTICS_EXPORT: 'REPORT_ANALYTICS.Export',
  REPORT_ANALYTICS_IMPORT: 'REPORT_ANALYTICS.Import',
  REPORT_ANALYTICS_APPROVE: 'REPORT_ANALYTICS.Approve',
  REPORT_ANALYTICS_EXECUTE: 'REPORT_ANALYTICS.Execute',
  
  // SYSTEM_ROLES
  SYSTEM_ROLES_READ: 'SYSTEM_ROLES.Read',
  SYSTEM_ROLES_WRITE: 'SYSTEM_ROLES.Write',
  SYSTEM_ROLES_DELETE: 'SYSTEM_ROLES.Delete',
  SYSTEM_ROLES_EXPORT: 'SYSTEM_ROLES.Export',
  SYSTEM_ROLES_IMPORT: 'SYSTEM_ROLES.Import',
  SYSTEM_ROLES_APPROVE: 'SYSTEM_ROLES.Approve',
  SYSTEM_ROLES_EXECUTE: 'SYSTEM_ROLES.Execute',
  
  // SYSTEM_USERS
  SYSTEM_USERS_READ: 'SYSTEM_USERS.Read',
  SYSTEM_USERS_WRITE: 'SYSTEM_USERS.Write',
  SYSTEM_USERS_DELETE: 'SYSTEM_USERS.Delete',
  SYSTEM_USERS_EXPORT: 'SYSTEM_USERS.Export',
  SYSTEM_USERS_IMPORT: 'SYSTEM_USERS.Import',
  SYSTEM_USERS_APPROVE: 'SYSTEM_USERS.Approve',
  SYSTEM_USERS_EXECUTE: 'SYSTEM_USERS.Execute',
  
  // HR_TIMEKEEPING
  HR_TIMEKEEPING_READ: 'HR_TIMEKEEPING.Read',
  HR_TIMEKEEPING_WRITE: 'HR_TIMEKEEPING.Write',
  HR_TIMEKEEPING_DELETE: 'HR_TIMEKEEPING.Delete',
  HR_TIMEKEEPING_EXPORT: 'HR_TIMEKEEPING.Export',
  HR_TIMEKEEPING_IMPORT: 'HR_TIMEKEEPING.Import',
  HR_TIMEKEEPING_APPROVE: 'HR_TIMEKEEPING.Approve',
  HR_TIMEKEEPING_EXECUTE: 'HR_TIMEKEEPING.Execute',
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
  CHANGE_PASSWORD: '/change-password',
  ERROR : '/error',
};
