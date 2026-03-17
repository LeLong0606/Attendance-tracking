/**
 * ChangePasswordUseCase
 * Thay đổi mật khẩu người dùng - Layer Domain
 */
export class ChangePasswordUseCase {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  /**
   * Thực thi thay đổi mật khẩu
   * @param {string} oldPassword - Mật khẩu cũ
   * @param {string} newPassword - Mật khẩu mới
   * @param {string} confirmPassword - Xác nhận mật khẩu
   * @returns {Promise<{accessToken?}>}
   */
  async execute(oldPassword, newPassword, confirmPassword) {
    try {
      if (!oldPassword || !newPassword || !confirmPassword) {
        throw new Error('Vui lòng nhập đầy đủ mật khẩu');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Mật khẩu mới không khớp');
      }

      if (newPassword.length < 6) {
        throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');   
      }

      const response = await this.authRepository.changePassword(oldPassword, newPassword, confirmPassword);
      return response;
    } catch (error) {
      throw error;
    }
  }
}
