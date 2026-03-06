/**
 * useAuth Hook
 * Custom hook để quản lý authentication
 */
import { useState, useCallback } from 'react';
import { AuthRepository } from '../../data/repositories/AuthRepository';
import { LoginUseCase } from '../../domain/usecases/LoginUseCase';
import { LogoutUseCase } from '../../domain/usecases/LogoutUseCase';
import { ChangePasswordUseCase } from '../../domain/usecases/ChangePasswordUseCase';
import { decodeToken, saveTokenToStorage, saveUserToStorage, getUserFromToken, clearAuthStorage, saveTempTokenToStorage, clearTempToken, handleForceLogout } from '../../config/TokenHelper';
import { STORAGE_TOKEN } from '../../config/constants';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Khởi tạo repositories và use cases
  const authRepository = new AuthRepository();
  const loginUseCase = new LoginUseCase(authRepository);
  const logoutUseCase = new LogoutUseCase(authRepository);
  const changePasswordUseCase = new ChangePasswordUseCase(authRepository);

  /**
   * Đăng nhập
   */
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      // Gọi use case đăng nhập
      const response = await loginUseCase.execute(username, password);
      
      // Debug: Log response structure
      if (!response) {
        throw new Error('Không nhận được response từ server');
      }

      // Kiểm tra nếu require password change
      if (response.requirePasswordChange && response.tempToken) {
        saveTempTokenToStorage(response.tempToken);
        
        return { 
          success: false, 
          requirePasswordChange: true, 
          user: response.user 
        };
      }

      // Kiểm tra accessToken
      if (!response.accessToken) {
        throw new Error('Không nhận được token từ server. Response: ' + JSON.stringify(response));
      }

      // Lưu token vào localStorage
      saveTokenToStorage(response.accessToken);
      clearTempToken(); // Xóa temp token nếu có

      // Decode token và lấy user info
      const decoded = decodeToken(response.accessToken);
      if (!decoded) {
        throw new Error('Không thể decode token');
      }

      // Lưu user info vào localStorage
      const user = getUserFromToken();
      if (user) {
        saveUserToStorage(user);
      }

      return { success: true, user, response };
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Đăng xuất
   */
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi use case đăng xuất
      // 💾 RefreshToken được gửi tự động bởi browser (withCredentials: true)
      await logoutUseCase.execute();

      // Xóa tất cả auth data từ localStorage
      clearAuthStorage();

      return { success: true };
    } catch (err) {
      // Vẫn xóa local data dù API gặp lỗi
      clearAuthStorage();
      setError(err.message || 'Đăng xuất thất bại');
      return { success: true }; // Coi là thành công vì đã xóa local data
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Force logout - Logout cứng khi token hết hạn hoặc bị từ chối (401/403)
   * Không gọi API, chỉ xóa local data và dispatch event
   */
  const forceLogout = useCallback(() => {
    handleForceLogout();
  }, []);

  /**
   * Thay đổi mật khẩu
   */
  const changePassword = useCallback(async (oldPassword, newPassword, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await changePasswordUseCase.execute(oldPassword, newPassword, confirmPassword);
      
      // Lưu access token mới nếu API trả về
      if (response && response.accessToken) {
        saveTokenToStorage(response.accessToken);
        
        // Lấy user info từ token mới
        const user = getUserFromToken();
        if (user) {
          saveUserToStorage(user);
        }
      }
      
      return { success: true };
    } catch (err) {
      setError(err?.message || err?.error || err?.detail || err?.data?.message || 'Thay đổi mật khẩu thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy user hiện tại đã lưu
   */
  const getCurrentUser = useCallback(() => {
    return getUserFromToken();
  }, []);

  /**
   * Kiểm tra xem user đã đăng nhập chưa
   */
  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem(STORAGE_TOKEN);
    const user = getUserFromToken();
    return !!token && !!user;
  }, []);

  /**
   * Thay đổi mật khẩu ban đầu (dùng temp token)
   */
  const changeInitialPassword = useCallback(async (newPassword, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authRepository.changeInitialPassword(newPassword, confirmPassword);
      
      // Xóa temp token
      clearTempToken();
      
      // Lưu access token mới
      if (response.accessToken) {
        saveTokenToStorage(response.accessToken);
        
        // Lấy user info từ token mới
        const user = getUserFromToken();
        if (user) {
          saveUserToStorage(user);
        }
      }
      
      return {
        success: true,
        message: response.message,
        hasAccessToken: !!response.accessToken,
      };
    } catch (err) {
      setError(err?.message || err?.error || err?.detail || err?.data?.message || 'Thay đổi mật khẩu thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    login,
    logout,
    forceLogout,
    changePassword,
    changeInitialPassword,
    getCurrentUser,
    isAuthenticated,
  };
};
