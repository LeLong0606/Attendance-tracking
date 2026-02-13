/**
 * TokenHelper
 * Tiện ích để làm việc với JWT tokens
 */
import { User } from '../domain/entities/User.entity';
import { STORAGE_TOKEN, STORAGE_USER } from '../config/constants';

/**
 * Decode JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload hoặc null nếu lỗi
 */
export const decodeToken = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    // Decode Base64 payload
    const decoded = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    return decoded;
  } catch (error) {
    console.error('❌ Lỗi decode token:', error);
    return null;
  }
};

/**
 * Lấy thông tin user từ token đã lưu
 * @returns {User|null} User instance hoặc null
 */
export const getUserFromToken = () => {
  try {
    // Lấy token từ localStorage
    const token = localStorage.getItem(STORAGE_TOKEN);
    if (!token) {
      console.warn('⚠️ Không tìm thấy token');
      return null;
    }

    // Decode token
    const decoded = decodeToken(token);
    if (!decoded) {
      console.warn('⚠️ Không thể decode token');
      return null;
    }

    // Kiểm tra token có hết hạn không
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      console.warn('⚠️ Token đã hết hạn');
      localStorage.removeItem(STORAGE_TOKEN);
      return null;
    }

    // Tạo User entity từ decoded token
    return new User(
      decoded.sub,
      decoded.unique_name,
      decoded.email,
      decoded.permissions || [],
      decoded.exp,
      decoded.iat
    );
  } catch (error) {
    console.error('❌ Lỗi lấy user từ token:', error);
    return null;
  }
};

/**
 * Lưu user vào localStorage
 * @param {User} user - User entity
 */
export const saveUserToStorage = (user) => {
  try {
    localStorage.setItem(STORAGE_USER, JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      permissions: user.permissions,
    }));
    console.log('✅ Lưu user vào storage thành công');
  } catch (error) {
    console.error('❌ Lỗi lưu user:', error);
  }
};

/**
 * Lưu token vào localStorage
 * @param {string} token - Access token
 */
export const saveTokenToStorage = (token) => {
  try {
    localStorage.setItem(STORAGE_TOKEN, token);
    console.log('✅ Lưu token vào storage thành công');
  } catch (error) {
    console.error('❌ Lỗi lưu token:', error);
  }
};

/**
 * Xóa tất cả thông tin auth khỏi localStorage
 */
export const clearAuthStorage = () => {
  try {
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_TOKEN);
    console.log('✅ Xóa auth storage thành công');
  } catch (error) {
    console.error('❌ Lỗi xóa auth storage:', error);
  }
};

/**
 * Lưu temp token vào localStorage (dùng khi cần đổi mật khẩu ban đầu)
 * @param {string} tempToken - Temporary token
 */
export const saveTempTokenToStorage = (tempToken) => {
  try {
    localStorage.setItem('tempToken', tempToken);
    console.log('✅ Lưu temp token vào storage thành công');
  } catch (error) {
    console.error('❌ Lỗi lưu temp token:', error);
  }
};

/**
 * Lấy temp token từ localStorage
 * @returns {string|null} Temp token hoặc null
 */
export const getTempToken = () => {
  try {
    return localStorage.getItem('tempToken');
  } catch (error) {
    console.error('❌ Lỗi lấy temp token:', error);
    return null;
  }
};

/**
 * Xóa temp token khỏi localStorage
 */
export const clearTempToken = () => {
  try {
    localStorage.removeItem('tempToken');
    console.log('✅ Xóa temp token thành công');
  } catch (error) {
    console.error('❌ Lỗi xóa temp token:', error);
  }
};

/**
 * Kiểm tra xem đang sử dụng temp token không
 * @returns {boolean}
 */
export const isUsingTempToken = () => {
  return !!getTempToken();
};

