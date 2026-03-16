/**
 * PayrollDataSource
 * Xử lý all API calls liên quan đến lương - Layer Data
 */
import axios from 'axios';
import { API_BASE_URL, STORAGE_TOKEN, API_ENDPOINTS, getLoginRedirectUrl } from '../../config/constants';
import { clearAuthStorage } from '../../config/TokenHelper';
// Tạo axios instance riêng cho payroll API
const payrollAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Thêm interceptor để tự động thêm Bearer token vào header
payrollAxios.interceptors.request.use(
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
payrollAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || '';
    const errorStatus = error.response?.status;
    const isTokenError = errorMessage.toLowerCase().includes('no user found') || 
                         errorMessage.toLowerCase().includes('token') ||
                         errorMessage.toLowerCase().includes('unauthorized') ||
                         errorMessage.toLowerCase().includes('no access');
    
    console.log('🔍 PayrollDataSource Error:', {
      status: errorStatus,
      message: errorMessage,
      isTokenError,
      hasToken: !!localStorage.getItem('token')
    });
    
    // ⚠️ Redirect khi gặp token errors (idle timeout, revoked, expired)
    if (errorStatus === 401 || errorStatus === 403 || isTokenError) {
      console.warn('⚠️ Token invalid/expired - clearing storage and redirecting...');
      // Set flag để hiện toast SAU KHI redirect
      sessionStorage.setItem('auth-expired-toast', '1');
      clearAuthStorage();
      window.location.href = getLoginRedirectUrl();
    }
    return Promise.reject(error);
  }
);

export class PayrollDataSource {
  /**
   * Lấy danh sách các thành phần lương
   * @returns {Promise<Array>} Danh sách thành phần lương
   */
  async getSalaryComponents() {
    try {
      const response = await payrollAxios.get(API_ENDPOINTS.GET_SALARY_COMPONENTS);
      const { data: responseData } = response;
      
      // Check nếu API trả về nested data structure: { success, data: [...] }
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Check if responseData itself is an array
      if (Array.isArray(responseData)) {
        return responseData;
      }
      
      // Fallback
      return responseData?.data || [];
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  /**
   * Lấy cơ cấu lương của người dùng
   * @param {string} userId - ID người dùng
   * @returns {Promise<Array>} Thông tin cơ cấu lương của người dùng
   */
  async getUserSalaryStructure(userId) {
    try {
      const endpoint = `${API_ENDPOINTS.GET_USER_SALARY_STRUCTURE}?id=${userId}`;
      const response = await payrollAxios.get(endpoint);
      const { data: responseData } = response;
      
      // Check nếu API trả về nested data structure: { success, data: [...] }
      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Check if responseData itself is an array
      if (Array.isArray(responseData)) {
        return responseData;
      }
      
      // Fallback
      return responseData?.data || [];
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}
