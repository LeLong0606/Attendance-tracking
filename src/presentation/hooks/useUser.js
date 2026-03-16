/**
 * useUser Hook
 * Custom hook để quản lý thông tin người dùng
 */
import { useState, useCallback } from 'react';
import { UserRepository } from '../../data/repositories/UserRepository';
import { GetProfileUseCase } from '../../domain/usecases/GetProfileUseCase';
import { UpdateProfileUseCase } from '../../domain/usecases/UpdateProfileUseCase';
import { getUserFromToken } from '../../config/TokenHelper';
import { getLoginRedirectUrl } from '../../config/constants';

export const useUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  // Khởi tạo repositories và use cases
  const userRepository = new UserRepository();
  const getProfileUseCase = new GetProfileUseCase(userRepository);
  const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

  /**
   * Lấy thông tin hồ sơ người dùng
   */
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Lấy user ID từ token
      const user = getUserFromToken();
      if (!user) {
    
        localStorage.clear();
        window.location.href = getLoginRedirectUrl();
        throw new Error('Token invalid - redirecting to login');
      }

      // Gọi use case lấy hồ sơ
      const data = await getProfileUseCase.execute(user.id);
      setProfile(data);

      return data;
    } catch (err) {
      setError(err.message || 'Lấy hồ sơ thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy thông tin hồ sơ cá nhân hiện tại
   */
  const loadProfileMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userRepository.getProfileMe();
      setProfile(data);
      return data;
      setError(err.message || 'Lấy hồ sơ cá nhân thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật thông tin hồ sơ người dùng
   */
  const updateProfile = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      // Gọi use case cập nhật hồ sơ
      await updateProfileUseCase.execute(profileData);

      // Cập nhật local state
      setProfile(profileData);

      return { success: true };
      setError(err.message || 'Cập nhật hồ sơ thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật thông tin cá nhân người dùng (/api/userProfile/me)
   */
  const updateProfileMe = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      await userRepository.updateProfileMe(profileData);
      return { success: true };
      setError(err.message || 'Cập nhật thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật thông tin người dùng (/api/user/{id})
   */
  const updateUser = useCallback(async (userId, userData) => {
    setLoading(true);
    setError(null);
    try {
      await userRepository.updateUser(userId, userData);
      return { success: true };
      setError(err.message || 'Cập nhật thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    loading,
    error,
    loadProfile,
    loadProfileMe,
    updateProfile,
    updateProfileMe,
    updateUser,
  };
};
