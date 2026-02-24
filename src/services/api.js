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
        console.warn('BroadcastChannel not supported');
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
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user profile by ID with Bearer token in Authorization header
  getProfile: async (id) => { 
    try {
      const response = await api.get(`/user/${id}`);
      return response.data;
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

  // Deactivate user (set isActive = 0)
  deactivateUser: async (userId) => {
    try {
      const response = await api.delete(`/user/${userId}`);
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
      return response.data;
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
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},
};

export const attendanceAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/attendance');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  
  
  update: async (id, attendanceData) => {
    try {
      const response = await api.put(`/attendance/${id}`, attendanceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/attendance/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  getStatistics: async () => {
    try {
      const response = await api.get('/attendance/statistics');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const payrollAPI = {
  // Calculate payroll for multiple employees
  calculatePayroll: async (month, year) => {
    try {
      // Create query string from employees array
     
      const params = new URLSearchParams({
        month,
        year
      });
      
      const response = await api.get(
        `/payroll/calculate?${params.toString()}`
      );
      return response.data;
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
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get timesheet data for an employee
  getTimesheetData: async (employeeId, month, year) => {
    try {
      console.log('[payrollAPI] getTimesheetData called');
      console.log('[payrollAPI] employeeId:', employeeId);
      console.log('[payrollAPI] month:', month, 'type:', typeof month);
      console.log('[payrollAPI] year:', year, 'type:', typeof year);
      
      // Build endpoint with month and year as query parameters
      const endpoint = `/payroll/timesheet/user/${employeeId}?month=${month}&year=${year}`;
      const fullUrl = API_BASE_URL + endpoint;
      
      console.log('[payrollAPI] Full endpoint:', endpoint);
      console.log('[payrollAPI] Full URL:', fullUrl);
      console.log('[payrollAPI] Calling API.get()...');
      
      const response = await api.get(endpoint);
      
      console.log('[payrollAPI] ✓ Response received');
      console.log('[payrollAPI] Status:', response.status);
      console.log('[payrollAPI] Data:', response.data);
      console.log('[payrollAPI] Data type:', typeof response.data);
      console.log('[payrollAPI] Is array?', Array.isArray(response.data));
      
      return response.data;
      
    } catch (error) {
      console.error('[payrollAPI] ✗ Error fetching timesheet data');
      console.error('[payrollAPI] Error message:', error.message);
      console.error('[payrollAPI] Error status:', error.response?.status);
      console.error('[payrollAPI] Error data:', error.response?.data);
      console.error('[payrollAPI] Full error:', error);
      
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
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Save single timesheet entry
  saveTimesheet: async (timesheetData) => {
    try {
      console.log('[saveTimesheet] Sending payload:', JSON.stringify(timesheetData, null, 2));
      console.log('[saveTimesheet] Employee ID in payload:', timesheetData.id);
      const response = await api.post('/payroll/timesheet', timesheetData);
      console.log('[saveTimesheet] Success response:', response.data);
      return response.data;
    } catch (error) {
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        payload: timesheetData
      };
      console.error('[saveTimesheet] Error:', errorDetail);
      if (error.response?.data?.errors) {
        console.error('[saveTimesheet] Validation errors:', error.response.data.errors);
      }
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
      console.log('[saveTimesheetBulk] ======== BULK SAVE START ========');
      console.log('[saveTimesheetBulk] Payload structure:');
      console.log('[saveTimesheetBulk]   id:', payload.id);
      console.log('[saveTimesheetBulk]   items.length:', payload.items.length);
      console.log('[saveTimesheetBulk] Full payload:', JSON.stringify(payload, null, 2));
      console.log('[saveTimesheetBulk] Endpoint: POST /payroll/timesheet/bulk');
      
      const response = await api.post('/payroll/timesheet/bulk', payload);
      console.log('[saveTimesheetBulk] ======== BULK SAVE SUCCESS ========');
      console.log('[saveTimesheetBulk] Response:', response.data);
      return response.data;
    } catch (error) {
      console.log('[saveTimesheetBulk] ======== BULK SAVE FAILED ========');
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        payload: { employeeId, itemCount: timesheetItems.length }
      };
      console.error('[saveTimesheetBulk] Error:', errorDetail);
      if (error.response?.data?.errors) {
        console.error('[saveTimesheetBulk] Validation errors:', error.response.data.errors);
      }
      throw errorDetail;
    }
  },

  // Save salary component
  saveSalaryComponent: async (salaryData) => {
    try {
      console.log('[saveSalaryComponent] Sending payload:', salaryData);
      const response = await api.post('/payroll/salary-structure', salaryData);
      console.log('[saveSalaryComponent] Success response:', response.data);
      return response.data;
    } catch (error) {
      const errorDetail = {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        payload: salaryData
      };
      console.error('[saveSalaryComponent] Error:', errorDetail);
      if (error.response?.data?.errors) {
        console.error('[saveSalaryComponent] Validation errors:', error.response.data.errors);
      }
      throw errorDetail;
    }
  },
};

export default api;
