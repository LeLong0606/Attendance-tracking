import axios from 'axios';
import { getUserFromToken } from '../config/TokenHelper';
import { API_BASE_URL, STORAGE_TOKEN, API_ENDPOINTS } from '../config/constants';

// Helper function to get cookie value
const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Allow sending cookies with requests
});

// Request interceptor to add auth token and refresh token
api.interceptors.request.use(
  (config) => {
    // Add Bearer token from localStorage
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add Refresh token from cookies
      // const refreshToken = getCookie(COOKIE_REFRESH_TOKEN);
      // if (refreshToken) {
      //   config.headers['X-Refresh-Token'] = refreshToken;
      // }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 🔴 Response interceptor to handle 401 - redirect immediately
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 🔴 Token expired - clear storage and trigger redirect
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      
      // Dispatch event to trigger redirect
      window.dispatchEvent(new Event('tokenExpired'));
      
      // Notify other tabs via BroadcastChannel
      try {
        const channel = new BroadcastChannel('auth-channel');
        channel.postMessage({ type: 'TOKEN_EXPIRED' });
        channel.close();
      } catch (err) {
        // Ignore BroadcastChannel errors
      }
    }
    return Promise.reject(error);
  }
);

// User API endpoints

export const userAPI = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('/user');
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
  },

  // Get user profile by ID with Bearer token in Authorization header
  getProfile: async (id) => { 
    try {
      const response = await api.get(`/user/${id}`);
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
  },
  
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Deactivate user (set isActive = 0) - calls delete API
  deactivateUser: async (userId) => {
    try {
      const response = await api.delete(`/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Restore user (activate again)
  restoreUser: async (userId) => {
    try {
      const response = await api.put(`/user/${userId}/restore`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user information
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/user/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user profile from /userProfile/{id}
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/userProfile/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update profile via /userProfile/me
  updateProfileMe: async (profileData) => {
    try {
      const response = await api.put('/userProfile/me', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user profile via /userProfile/{id}
  updateUserProfile: async (userId, profileData) => {
    try {
      const response = await api.put(`/userProfile/${userId}`, profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Upload avatar file
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/userProfile/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { data: responseData } = response;
      
      // Check if API trả về nested data structure: { success, data: { avatarUrl } }
      if (responseData && responseData.data && typeof responseData.data === 'object') {
        return {
          url: responseData.data.avatarUrl || responseData.data.url,
          message: responseData.message || 'Tải ảnh lên thành công',
          data: responseData.data.avatarUrl || responseData.data.url
        };
      }
      
      // Fallback: responseData might be { avatarUrl, ... } or { url, ... }
      return {
        url: responseData?.avatarUrl || responseData?.url || responseData,
        message: responseData?.message || 'Tải ảnh lên thành công',
        data: responseData?.avatarUrl || responseData?.url || responseData
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update avatar URL for user
  updateAvatarUrl: async (userId, avatarUrl) => {
    try {
      const response = await api.put(`/userProfile/${userId}`, { avatarUrl });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createUser: async (userdata) => {
   
  try {
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (!token) {
      throw new Error('Không có accessToken. Vui lòng đăng nhập lại.');
    }
    
    const response = await api.post('/user/create-auto', userdata);
    const responseData = response.data;
    
    // Extract inner data if wrapped in structure: { success, message, data: {...} }
    if (responseData && responseData.data && typeof responseData.data === 'object') {
      return responseData.data;
    }
    return responseData;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},

createUserWithPassword: async (userdata) => {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (!token) {
      throw new Error('Không có accessToken. Vui lòng đăng nhập lại.');
    }
    
    const response = await api.post('/user', userdata);
    const responseData = response.data;
    
    // Extract inner data if wrapped in structure: { success, message, data: {...} }
    if (responseData && responseData.data && typeof responseData.data === 'object') {
      return responseData.data;
    }
    return responseData;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},
};



export const payrollAPI = {
  // Calculate payroll for multiple employees
  calculatePayroll: async (month, year) => {
    try {
      const params = new URLSearchParams({
        month,
        year
      });
      
      const response = await api.get(
        `/payroll/calculate?${params.toString()}`
      );
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
  },

  // Calculate payroll for single employee
  calculateSinglePayroll: async (employeeId, month, year) => {
    try {
      const params = new URLSearchParams({
        month,
        year
      });
      
      const response = await api.get(
        `/payroll/calculate/${employeeId}?${params.toString()}`
      );
      const { data: responseData } = response;
      
      // Check nếu API trả về nested data structure: { success, data: {...} }
      if (responseData && responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
        return responseData.data;
      }
      
      // Check if responseData itself is object
      return responseData;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get timesheet data for an employee
  getTimesheetData: async (employeeId, month, year) => {
    try {
      const endpoint = `/payroll/timesheet/user/${employeeId}?month=${month}&year=${year}`;
      
      const response = await api.get(endpoint);
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
      // Return empty array on error
      return [];
    }
  },

  // Get salary structure for an employee
  getSalaryStructure: async (employeeId) => {
    try {
      const response = await api.get(
        `/payroll/salary-structure/user/${employeeId}`
      );
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
  },

  // Get advance payment history for an employee
  getAdvancePaymentData: async (employeeId, month, year) => {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/payroll/advance/user/${employeeId}?${queryString}`
        : `/payroll/advance/user/${employeeId}`;
      
      const response = await api.get(url);
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
      // Return empty array on error
      return [];
    }
  },

  // Save single timesheet entry
  saveTimesheet: async (timesheetData) => {
    try {
      return response.data;
    } catch (error) {
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        payload: timesheetData
      };
      throw errorDetail;
    }
  },

  // Save multiple timesheet entries in bulk
  saveTimesheetBulk: async (employeeId, timesheetItems) => {
    try {
      const payload = {
        id: employeeId,
        items: timesheetItems
      };

      
      const response = await api.post('/payroll/timesheet/bulk', payload);
      return response.data;
    } catch (error) {
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        payload: { employeeId, itemCount: timesheetItems.length }
      };
      throw errorDetail;
    }
  },

  // Save salary component
  saveSalaryComponent: async (salaryData) => {
    try {
      const response = await api.post('/payroll/salary-structure', salaryData);
      return response.data;
    } catch (error) {
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        payload: salaryData
      };
      throw errorDetail;
    }
  },

  // Update salary component
  updateSalaryComponent: async (componentId, salaryData) => {
    try {
      const response = await api.put(`/payroll/salary-structure/${componentId}`, salaryData);
      return response.data;
    } catch (error) {
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        componentId: componentId,
        payload: salaryData
      };
      throw errorDetail;
    }
  },

  // Save advance payment
  saveAdvancePayment: async (advanceData) => {
    try {
      const response = await api.post('/payroll/advance', advanceData);
      return response.data;
    } catch (error) {
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        payload: advanceData
      };
      throw errorDetail;
    }
  },

  // Update advance payment
  updateAdvancePayment: async (advanceId, advanceData) => {
    try {
      const response = await api.put(`/payroll/advance/${advanceId}`, advanceData);
      return response.data;
    } catch (error) {
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        advanceId: advanceId,
        payload: advanceData
      };
      throw errorDetail;
    }
  },

  // Delete advance payment
  deleteAdvancePayment: async (advanceId) => {
    try {
      const response = await api.delete(`/payroll/advance/${advanceId}`);
      return response.data;
    } catch (error) {
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        advanceId: advanceId
      };
      throw errorDetail;
    }
  },
};

export default api;
