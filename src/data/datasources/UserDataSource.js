/**
 * UserDataSource
 * Xử lý all API calls liên quan đến user - Layer Data
 */
import axios from 'axios';
import { API_BASE_URL, STORAGE_TOKEN, API_ENDPOINTS } from '../../config/constants';

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
      console.log('✅ AccessToken đã thêm vào header');
    } else {
      console.warn('⚠️ Không tìm thấy accessToken trong localStorage');
    }
    return config;
  },
  (error) => {
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
      console.log(`📥 Lấy hồ sơ người dùng ${id}...`);
      const response = await userAxios.get(`/user/${id}`);
      console.log('✅ Lấy hồ sơ thành công');
      return response.data;
    } catch (error) {
      console.error('❌ Get profile API error:', error);
      throw error.response?.data || error.message;
    }
  }

  /**
   * Lấy thông tin hồ sơ cá nhân hiện tại (/api/userProfile/me)
   * @returns {Promise<Object>} Thông tin hồ sơ cá nhân
   */
  async getProfileMe() {
    try {
      console.log('📥 Lấy thông tin hồ sơ cá nhân...');
      const response = await userAxios.get(API_ENDPOINTS.UPDATE_PROFILE_ME);
      console.log('✅ Lấy hồ sơ cá nhân thành công');
      return response.data;
    } catch (error) {
      console.error('❌ Get profile me API error:', error);
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
      console.log('📝 Cập nhật hồ sơ người dùng...');
      const response = await userAxios.put(API_ENDPOINTS.UPDATE_PROFILE_ME, profileData);
      console.log('✅ Cập nhật hồ sơ thành công');
      return response.data;
    } catch (error) {
      console.error('❌ Update profile API error:', error);
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
      console.log('📝 Cập nhật thông tin cá nhân...');
      console.log('📤 Dữ liệu gửi:', profileData);
      const token = localStorage.getItem(STORAGE_TOKEN);
      console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'Không tìm thấy');
      
      const response = await userAxios.put(API_ENDPOINTS.UPDATE_PROFILE_ME, profileData);
      console.log('✅ Cập nhật thông tin cá nhân thành công');
      return response.data;
    } catch (error) {
      console.error('❌ Update profile me API error:', error);
      console.error('❌ Error response:', error.response);
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
      console.log('📝 Cập nhật thông tin người dùng...');
      console.log('📤 Dữ liệu gửi:', userData);
      const response = await userAxios.put(`/user/${userId}`, userData);
      console.log('✅ Cập nhật thông tin người dùng thành công');
      return response.data;
    } catch (error) {
      console.error('❌ Update user API error:', error);
      throw error.response?.data || error.message;
    }
  }

  /**
   * Lấy danh sách tất cả người dùng
   * @returns {Promise<Array>} Danh sách người dùng
   */
  async getAllUsers() {
    try {
      console.log('📥 Lấy danh sách tất cả người dùng...');
      const response = await userAxios.get('/users'); 
      console.log('✅ Lấy danh sách người dùng thành công');
      return response.data;
    } catch (error) {
      console.error('❌ Get all users API error:', error);
      throw error.response?.data || error.message;
    }
  }
}
