/**
 * UserDataSource
 * Xử lý all API calls liên quan đến user - Layer Data
 */
import axios from 'axios';
import { API_BASE_URL, STORAGE_TOKEN, API_ENDPOINTS, getLoginRedirectUrl } from '../../config/constants';
import { clearAuthStorage } from '../../config/TokenHelper';

// Tạo axios instance riêng cho user API
const userAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Thêm interceptor để tự động thêm Bearer token vào header
userAxios.interceptors.request.use(
  (config) => {
    // Lấy access token từ localStorage
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm response interceptor để handle 401/403 và token errors
userAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || '';
    const errorStatus = error.response?.status;
    const isTokenError = errorMessage.toLowerCase().includes('no user found') || 
                         errorMessage.toLowerCase().includes('token') ||
                         errorMessage.toLowerCase().includes('unauthorized') ||
                         errorMessage.toLowerCase().includes('no access');
    

    // ⚠️ Redirect khi gặp token errors (idle timeout, revoked, expired)
    // KHÔNG cần check token trong localStorage vì token có thể vẫn còn nhưng đã invalid ở server
    if (errorStatus === 401 || errorStatus === 403 || isTokenError) {
  
      // Set flag để hiện toast SAU KHI redirect
      sessionStorage.setItem('auth-expired-toast', '1');
      clearAuthStorage();
      window.location.href = getLoginRedirectUrl();
    }
    return Promise.reject(error);
  }
);

export class UserDataSource {
  /**
   * Lấy thông tin hồ sơ người dùng
   * @param {string} id - ID người dùng
   * @returns {Promise<Object>} Thông tin hồ sơ
   */
  async getProfile(id) {
    try {
      const response = await userAxios.get(`/user/${id}`);
      const { data: responseData } = response;
      
      // Check nếu API trả về nested data structure: { success, data: { ... } }
      if (responseData && responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Fallback: nếu trả về trực tiếp
      return responseData;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Lấy thông tin hồ sơ cá nhân hiện tại (/api/userProfile/me)
   * @returns {Promise<Object>} Thông tin hồ sơ cá nhân
   */
  async getProfileMe() {
    try {
      const response = await userAxios.get(API_ENDPOINTS.UPDATE_PROFILE_ME);
      const { data: responseData } = response;
      
      // Check nếu API trả về nested data structure: { success, data: { ... } }
      if (responseData && responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Fallback: nếu trả về trực tiếp
      return responseData;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Cập nhật hồ sơ người dùng
   * @param {Object} profileData - Dữ liệu hồ sơ cần cập nhật
   * @returns {Promise<Object>}
   */
  async updateProfile(profileData) {
    try {
      const response = await userAxios.put(API_ENDPOINTS.UPDATE_PROFILE_ME, profileData);
      const { data: responseData } = response;
      
      // Check nếu API trả về nested data structure: { success, data: { ... } }
      if (responseData && responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Fallback
      return responseData;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Cập nhật hồ sơ người dùng hiện tại (/api/userProfile/me)
   * @param {Object} profileData - Dữ liệu hồ sơ cần cập nhật
   * @returns {Promise<Object>}
   */
  async updateProfileMe(profileData) {
    try {
      const token = localStorage.getItem(STORAGE_TOKEN);
      
      const response = await userAxios.put(API_ENDPOINTS.UPDATE_PROFILE_ME, profileData);
      const { data: responseData } = response;
      
      // Check nếu API trả về nested data structure: { success, data: { ... } }
      if (responseData && responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Fallback
      return responseData;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Cập nhật thông tin người dùng (/api/user/{id})
   * @param {string} userId - ID người dùng
   * @param {Object} userData - Dữ liệu người dùng cần cập nhật
   * @returns {Promise<Object>}
   */
  async updateUser(userId, userData) {
    try {
      const response = await userAxios.put(`/user/${userId}`, userData);
      const { data: responseData } = response;
      
      // Check nếu API trả về nested data structure: { success, data: { ... } }
      if (responseData && responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Fallback
      return responseData;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Lấy danh sách tất cả người dùng
   * @returns {Promise<Array>} Danh sách người dùng
   */
  async getAllUsers() {
    try {
      const response = await userAxios.get('/users'); 
      const { data: responseData } = response;
      
      // Check nếu API trả về nested data structure: { success, data: [...] }
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Check if responseData itself is an array
      if (Array.isArray(responseData)) {
        return responseData;
      }
      
      // Fallback: return array or empty
      return responseData?.data || [];
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}
