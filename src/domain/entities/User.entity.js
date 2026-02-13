/**
 * User Entity
 * Định nghĩa cấu trúc dữ liệu User - Layer Domain
 */
export class User {
  constructor(id, username, email, permissions, exp, iat) {
    this.id = id;                          // ID người dùng
    this.username = username;              // Tên đăng nhập
    this.email = email;                    // Email
    this.permissions = permissions || []; // Danh sách quyền
    this.exp = exp;                        // Thời gian hết hạn token
    this.iat = iat;                        // Thời gian tạo token
    this.fullName = null;                  // Tên đầy đủ (lấy từ API sau)
  }

  /**
   * Kiểm tra token có hết hạn không
   */
  isTokenExpired() {
    const currentTime = Math.floor(Date.now() / 1000);
    return this.exp && this.exp < currentTime;
  }

  /**
   * Kiểm tra người dùng có quyền cụ thể không
   */
  hasPermission(permission) {
    if (Array.isArray(this.permissions)) {
      return this.permissions.includes(permission);
    }
    return this.permissions === permission;
  }

  /**
   * Kiểm tra người dùng là Admin
   */
  isAdmin() {
    return (
      this.username?.toLowerCase() === 'admin' ||
      (Array.isArray(this.permissions) && 
       this.permissions.some(p => p.startsWith('SYSTEM_')))
    );
  }
}
