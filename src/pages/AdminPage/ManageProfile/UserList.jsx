import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../../hooks/useToast';
import { userAPI } from '../../../services/api';
import './ManageProfile.css';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { showToast } = useToast();
  const tableWrapperRef = useRef(null);

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      const allUsers = response.data || response;
      //  Filter: chỉ show users có isActive = 1
    //  const activeUsers = allUsers.filter(user => user.isActive === 1 || user.isActive === true);
      setUsers(allUsers);
    } catch (error) {
      showToast('Lỗi khi tải danh sách người dùng', 'error');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeleteUser = (userId) => {
    setSelectedUserId(userId);
    setShowConfirmModal(true);
  };

  const confirmDeactivate = async () => {
    if (!selectedUserId) return;

    try {
      setIsDeactivating(true);
      //  Gọi API để set isActive = 0 (soft delete)
      await userAPI.deactivateUser(selectedUserId);
      // Remove from local state
      const updatedUsers = users.filter(u => u.id !== selectedUserId);
      setUsers(updatedUsers);
      
      // Adjust current page if needed
      const newFilteredCount = updatedUsers.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      ).length;
      const newTotalPages = Math.ceil(newFilteredCount / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
      showToast('Xóa người dùng thành công', 'success');
      setShowConfirmModal(false);
      setSelectedUserId(null);
    } catch (error) {
      showToast('Lỗi khi xóa người dùng', 'error');
      console.error('Error deactivating user:', error);
    } finally {
      setIsDeactivating(false);
    }
  };

  const cancelDeactivate = () => {
    setShowConfirmModal(false);
    setSelectedUserId(null);
  };

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h2 className="user-list-title">Danh sách người dùng</h2>
        <div className="user-list-controls">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, username hoặc email..."
            className="user-search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button className="refresh-button" onClick={fetchUsers}>
            <i className="fa-solid fa-rotate-right"></i> Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <i className="fa-solid fa-spinner fa-spin"></i> Đang tải...
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-users"></i>
          <p>Không có người dùng hoạt động nào</p>
        </div>
      ) : (
        <div className="user-list-wrapper" ref={tableWrapperRef}>
          <table className="user-list-table">
            <thead>
              <tr>
                <th className="col-username">Tên đăng nhập</th>
                <th className="col-fullname">Tên đầy đủ</th>
                <th className="col-email">Email</th>
                <th className="col-status">Trạng thái</th>
                <th className="col-created">Ngày tạo</th>
                <th className="col-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="user-row">
                  <td className="col-username">{user.username}</td>
                  <td className="col-fullname">{user.fullName}</td>
                  <td className="col-email">{user.email}</td>
                  <td className="col-status">
                    <span className={`status-badge status-${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </td>
                  <td className="col-created">{user.createdAt}</td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button className="btn-edit" title="Chỉnh sửa">
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        className="btn-delete"
                        title="Vô hiệu hóa"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="no-results">
              <p>Không tìm thấy người dùng phù hợp với tiêu chí tìm kiếm</p>
            </div>
          )}

          <div className="user-list-footer">
            <div className="pagination-info">
              <p>Tổng cộng: <strong>{filteredUsers.length}</strong> người dùng</p>
            </div>
            {filteredUsers.length > itemsPerPage && (
              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  title="Trang trước"
                >
                  <i className="fa-solid fa-chevron-left"></i> Trước
                </button>
                <div className="pagination-info-center">
                  <span>Trang <strong>{currentPage}</strong> / {totalPages}</span>
                </div>
                <button
                  className="pagination-button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  title="Trang sau"
                >
                  Sau <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
           
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              Bạn có chắc chắn muốn xóa người dùng này? 
            </p>
            <div className="modal-buttons">
              <button
                className="cancel-button"
                onClick={cancelDeactivate}
                disabled={isDeactivating}
              >
                Hủy
              </button>
              <button
                className="confirm-button"
                onClick={confirmDeactivate}
                disabled={isDeactivating}
              >
                {isDeactivating ? '...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserList;
