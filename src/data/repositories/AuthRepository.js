/**
 * AuthRepository
 * Implementation của IAuthRepository - Layer Data
 */
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { AuthDataSource } from '../datasources/AuthDataSource';

export class AuthRepository extends IAuthRepository {
  constructor() {
    super();
    this.dataSource = new AuthDataSource();
  }

  /**
   * Đăng nhập người dùng
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<{accessToken, message}>}
   */
  async login(username, password) {
    return this.dataSource.login(username, password);
  }

  /**
   * Đăng xuất người dùng
   * @returns {Promise<void>}
   */
  async logout() {
    return this.dataSource.logout();
  }

  /**
   * Thay đổi mật khẩu
   * @param {string} oldPassword - Mật khẩu cũ
   * @param {string} newPassword - Mật khẩu mới
   * @param {string} confirmPassword - Xác nhận mật khẩu
   * @returns {Promise<void>}
   */
  async changePassword(oldPassword, newPassword, confirmPassword) {
    return this.dataSource.changePassword(oldPassword, newPassword, confirmPassword);
  }

  /**
   * Thay đổi mật khẩu ban đầu (dùng temp token)
   * @param {string} newPassword - Mật khẩu mới
   * @param {string} confirmPassword - Xác nhận mật khẩu mới
   * @returns {Promise<{accessToken}>}
   */
  async changeInitialPassword(newPassword, confirmPassword) {
    return this.dataSource.changeInitialPassword(newPassword, confirmPassword);
  }
}
