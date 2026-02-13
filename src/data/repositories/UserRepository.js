/**
 * UserRepository
 * Implementation của IUserRepository - Layer Data
 */
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserDataSource } from '../datasources/UserDataSource';

export class UserRepository extends IUserRepository {
  constructor() {
    super();
    this.dataSource = new UserDataSource();
  }

  /**
   * Lấy thông tin hồ sơ người dùng
   * @param {string} id - ID người dùng
   * @returns {Promise<Object>}
   */
  async getProfile(id) {
    return this.dataSource.getProfile(id);
  }

  /**
   * Lấy thông tin hồ sơ cá nhân hiện tại
   * @returns {Promise<Object>}
   */
  async getProfileMe() {
    return this.dataSource.getProfileMe();
  }

  /**
   * Cập nhật hồ sơ người dùng
   * @param {Object} profileData - Dữ liệu hồ sơ cần cập nhật
   * @returns {Promise<void>}
   */
  async updateProfile(profileData) {
    return this.dataSource.updateProfile(profileData);
  }

  /**
   * Cập nhật hồ sơ người dùng hiện tại
   * @param {Object} profileData - Dữ liệu hồ sơ cần cập nhật
   * @returns {Promise<Object>}
   */
  async updateProfileMe(profileData) {
    return this.dataSource.updateProfileMe(profileData);
  }

  /**
   * Cập nhật thông tin người dùng
   * @param {string} userId - ID người dùng
   * @param {Object} userData - Dữ liệu người dùng cần cập nhật
   * @returns {Promise<Object>}
   */
  async updateUser(userId, userData) {
    return this.dataSource.updateUser(userId, userData);
  }

  /**
   * Lấy danh sách tất cả người dùng
   * @returns {Promise<Array>}
   */
  async getAllUsers() {
    return this.dataSource.getAllUsers();
  }
}
