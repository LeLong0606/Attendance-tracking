/**
 * AuthDataSource
 * Xử lý all API calls liên quan đến authentication - Layer Data
 */
import axios from 'axios';
import { API_BASE_URL, STORAGE_TOKEN, API_ENDPOINTS } from '../../config/constants';

/**
 * 🔍 Debug: In tất cả cookies hiện có
 */
const logAllCookies = () => {
  // Cookies logging removed
};

// Tạo axios instance riêng cho auth
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Cho phép gửi cookies cùng với request
});

// 🔍 Request interceptor
authAxios.interceptors.request.use(
  (config) => {
    // Lấy access token từ localStorage
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (token) {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🔍 Response interceptor
authAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    throw error;
  }
);

export class AuthDataSource {
  /**
   * Đăng nhập người dùng
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<{accessToken, message}>}
   */
  async login(username, password) {
    try {
      const response = await authAxios.post(API_ENDPOINTS.LOGIN, {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Đăng nhập thất bại';
      const err = new Error(errorMessage);
      throw err;
    }
  }

  /**
   * Đăng xuất người dùng
   * 💡 Browser sẽ tự động gửi refreshToken từ HTTP-only Cookie nhờ withCredentials: true
   * Không cần truyền refreshToken trong body
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      const response = await authAxios.post(API_ENDPOINTS.LOGOUT);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Đăng xuất thất bại';
      const err = new Error(errorMessage);
      throw err;
    }
  }

  /**
   * Thay đổi mật khẩu
   * @param {string} oldPassword - Mật khẩu cũ
   * @param {string} newPassword - Mật khẩu mới
   * @param {string} confirmPassword - Xác nhận mật khẩu
   * @returns {Promise<void>}
   * 
   * 🔍 TROUBLESHOOTING nếu nhận 500 error:
   * 1. Kiểm tra Bearer token có hợp lệ không (check console logs)
   * 2. Kiểm tra tên field: oldPassword, newPassword, confirmPassword
   * 3. So sánh trong Postman:
   *    - Body type: raw JSON
   *    - Headers: Authorization: Bearer <token>
   *    - Content-Type: application/json
   * 4. Kiểm tra response body có lỗi gì không (xem console error)
   */
  async changePassword(oldPassword, newPassword, confirmPassword) {
    try {
      const token = localStorage.getItem(STORAGE_TOKEN);
      if (!token) {
        throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      }
      
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Token không hợp lệ. Vui lòng đăng nhập lại.');
      }
      
      const payload = {
        oldPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      };
      
      const response = await authAxios.post(API_ENDPOINTS.CHANGE_PASSWORD, payload);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Thay đổi mật khẩu thất bại';
      const err = new Error(errorMessage);
      throw err;
    }
  }

  /**
   * Thay đổi mật khẩu ban đầu (dùng temp token)
   * @param {string} newPassword - Mật khẩu mới
   * @param {string} confirmPassword - Xác nhận mật khẩu mới
   * @returns {Promise<{accessToken}>}
   */
  async changeInitialPassword(newPassword, confirmPassword) {
    try {
      const { getTempToken } = await import('../../config/TokenHelper');
      const tempToken = getTempToken();
      
      if (!tempToken) {
        throw new Error('Token tạm thời không hợp lệ. Vui lòng đăng nhập lại.');
      }

      const payload = {
        newPassword,
        confirmNewPassword: confirmPassword,
      };

      // Create a special axios instance for temp token
      const tempAuthAxios = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`,
        },
        withCredentials: true,
      });

      const response = await tempAuthAxios.post(API_ENDPOINTS.CHANGE_INITIAL_PASSWORD, payload);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Thay đổi mật khẩu thất bại';
      const err = new Error(errorMessage);
      throw err;
    }
  }
}
