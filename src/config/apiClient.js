import { API_BASE_URL, STORAGE_TOKEN, ROUTES } from './constants';
import { clearAuthStorage } from './TokenHelper';

/**
 * API Client
 * Wrapper around fetch để tự động thêm token và handle errors
 */
export const apiClient = async (url, options = {}) => {
  // Lấy token từ localStorage
  const token = localStorage.getItem(STORAGE_TOKEN);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Nếu có token, thêm vào Authorization header
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Nếu 401 (token hết hạn):
    if (response.status === 401) {
      clearAuthStorage(); // Xóa auth data
      localStorage.setItem("logout-event", Date.now().toString());
      // 📢 Broadcast event để các tab khác nhận được
      window.dispatchEvent(new Event('tokenExpired'));
      // 📢 Broadcast qua BroadcastChannel cho các tab khác
      try {
        const channel = new BroadcastChannel('auth-channel');
        channel.postMessage({ type: 'TOKEN_EXPIRED' });
        channel.close();
      } catch (error) {
        console.warn('BroadcastChannel không được hỗ trợ');
      }
      return Promise.reject("Unauthorized - Token expired");
    }

    return response;
  } catch (error) {
    console.error('API Client Error:', error);
    return Promise.reject(error);
  }
};

export default apiClient;
