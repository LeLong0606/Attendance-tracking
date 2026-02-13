/**
 * LoginUseCase
 * Xử lý logic đăng nhập - Layer Domain
 */
export class LoginUseCase {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  /**
   * Thực thi đăng nhập
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<{accessToken|requirePasswordChange}>}
   */
  async execute(username, password) {
    // Kiểm tra input
    if (!username || !password) {
      throw new Error('Tên đăng nhập và mật khẩu không được rỗng');
    }

    try {
      // Gọi repository để đăng nhập
      const result = await this.authRepository.login(username, password);

      if (!result) {
        throw new Error('Đăng nhập thất bại: Không nhận được response từ server');
      }

      // Kiểm tra xem có yêu cầu đổi mật khẩu lần đầu không
      if (result.requirePasswordChange && result.tempToken) {
        return result;
      }

      // Kiểm tra xem có accessToken không (đăng nhập bình thường)
      if (!result.accessToken) {
        throw new Error('Đăng nhập thất bại: Không nhận được token');
      }

      return result;
    } catch (error) {
      console.error('❌ LoginUseCase error:', error);
      throw error;
    }
  }
}
