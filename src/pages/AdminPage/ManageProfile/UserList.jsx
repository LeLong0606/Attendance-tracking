import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../../hooks/useToast';
import { userAPI } from '../../../services/api';
import { translateErrorMessage } from '../../../config/constants';
import {
  FaPlus,
  FaFilter,
  FaCheckCircle,
  FaBan,
  FaRedo,
  FaSpinner,
  FaUsers,
  FaEye,
  FaLock,
  FaLockOpen,
  FaStepBackward,
  FaChevronLeft,
  FaChevronRight,
  FaStepForward,
} from 'react-icons/fa';
import './ManageProfile.css';

function UserList({ onPageChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(true);
  const [filterInactive, setFilterInactive] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [lockActionType, setLockActionType] = useState(null); // 'deactivate' or 'restore'
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [originalEditingUser, setOriginalEditingUser] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const itemsPerPage = 10;
  const { showToast } = useToast();
  const tableWrapperRef = useRef(null);
  const filterMenuRef = useRef(null);

  // Lấy danh sách người dùng từ API
  useEffect(() => { 
    fetchUsers();
  }, []);

  // Cuộn lên đầu danh sách khi đổi trang
  useEffect(() => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Đóng menu lọc khi nhấn ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };

    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilterMenu]);

  // Lấy hồ sơ người dùng khi mở modal
  useEffect(() => {
    if (showEditModal && editingUser && !isEditingMode) {
      handleStartEditing();
    }
  }, [showEditModal]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      const allUsers = response.data || response;
     
      setUsers(allUsers);
    } catch (error) {
      showToast(translateErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lọc người dùng theo từ khóa tìm kiếm và trạng thái
  const filteredUsers = users.filter(user => {
    // Điều kiện lọc theo từ khóa
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Điều kiện lọc trạng thái theo các ô đã chọn
    const matchesStatus = 
      (filterActive && filterInactive) || // Chọn cả hai: hiển thị tất cả
      (filterActive && user.isActive) ||  // Chỉ chọn hoạt động
      (filterInactive && !user.isActive); // Chỉ chọn vô hiệu hóa
    
    return matchesSearch && matchesStatus;
  });

  // Tính phân trang
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Đặt lại về trang 1 khi từ khóa tìm kiếm thay đổi
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Xử lý thay đổi bộ lọc checkbox
  const handleFilterActiveChange = (e) => {
    setFilterActive(e.target.checked);
    setCurrentPage(1);
  };

  const handleFilterInactiveChange = (e) => {
    setFilterInactive(e.target.checked);
    setCurrentPage(1);
  };

  const handleLockToggle = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    setSelectedUserId(userId);
    setLockActionType(!user.isActive ? 'restore' : 'deactivate');
    setShowConfirmModal(true);
  };

  const confirmLockToggle = async () => {
    if (!selectedUserId || !lockActionType) return;

    try {
      setIsDeactivating(true);
      
      if (lockActionType === 'restore') {
        // Người dùng đang vô hiệu hóa (khóa xanh) - gọi API khôi phục
        await userAPI.restoreUser(selectedUserId);
        
        // Cập nhật trạng thái isActive của người dùng
        const updatedUsers = users.map(u => 
          u.id === selectedUserId ? { ...u, isActive: true } : u
        );
        setUsers(updatedUsers);
        
        showToast('Khôi phục người dùng thành công', 'success');
      } else if (lockActionType === 'deactivate') {
        // Người dùng đang hoạt động (khóa đỏ) - gọi API vô hiệu hóa
        await userAPI.deactivateUser(selectedUserId);
        
        // Cập nhật trạng thái isActive của người dùng
        const updatedUsers = users.map(u => 
          u.id === selectedUserId ? { ...u, isActive: false } : u
        );
        setUsers(updatedUsers);
        
        showToast('Xóa người dùng thành công', 'success');
      }
      
      setShowConfirmModal(false);
      setSelectedUserId(null);
      setLockActionType(null);
    } catch (error) {
      showToast(translateErrorMessage(error), 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  const cancelLockToggle = () => {
    setShowConfirmModal(false);
    setSelectedUserId(null);
    setLockActionType(null);
  };

  // Hàm hỗ trợ định dạng số điện thoại (hiển thị 3 số đầu, ẩn phần còn lại bằng *)
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length <= 3) return phoneStr;
    const firstThree = phoneStr.substring(0, 3);
    const rest = '*'.repeat(phoneStr.length - 3);
    return firstThree + rest;
  };

  // Hàm hỗ trợ định dạng ngày từ API về YYYY-MM-DD
  const formatDateFromAPI = (dateValue) => {
    if (!dateValue) return '';
    
    const value = dateValue.toString().trim();
    
    // Trường hợp định dạng: YYYY-MM-DDTHH:mm:ss
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    
    // Trường hợp định dạng lộn xộn như: 30T00:00:00/01/2026 - tách dd/mm/yyyy
    const mixedMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mixedMatch) {
      const [, day, month, year] = mixedMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Trường hợp định dạng: dd/mm/yyyy
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Nếu đã là YYYY-MM-DD thì giữ nguyên
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }
    
    return '';
  };

  const formatCreatedDate = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    try {
      const date = new Date(dateTimeString);
      
      // Lấy thành phần thời gian
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      // Lấy thành phần ngày tháng
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch (error) {
      return dateTimeString;
    }
  };

  const handleEditUser = (user) => {
    // Chỉ mở modal ở chế độ xem với dữ liệu cơ bản của người dùng
    setEditingUser({ ...user });
    setIsEditingMode(false);
    setShowEditModal(true);
  };

  const handleStartEditing = async () => {
    if (!editingUser) return;
    try {
      setIsLoadingProfile(true);
      // Lấy đầy đủ hồ sơ người dùng từ /userProfile/{id}
      const profileData = await userAPI.getUserProfile(editingUser.id);
      const userData = profileData.data || profileData;
      
      // Định dạng ngày từ API về YYYY-MM-DD
      const formattedDob = formatDateFromAPI(userData.dateOfBirth || userData.birthDate || userData.dob || '');
      
      // Ánh xạ trường dữ liệu từ API (hỗ trợ nhiều tên trường)
      const mappedUser = {
        ...editingUser,
        ...userData,
        fullName: userData.fullName || editingUser.fullName,
        email: userData.email || editingUser.email,
        phone: userData.phoneNumber || userData.phone || editingUser.phone || '', // API dùng phoneNumber
        dateOfBirth: formattedDob, // Dùng ngày đã định dạng
        gender: userData.gender || editingUser.gender || ''
      };
      
      setEditingUser(mappedUser);
      setOriginalEditingUser(mappedUser);
    } catch (error) {
      showToast(translateErrorMessage(error), 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Vào chế độ chỉnh sửa (sau khi tải xong dữ liệu)
  const handleEnterEditMode = () => {
    setIsEditingMode(true);
  };

  // Về trang đầu
  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  // Về trang cuối
  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handleEditInputChange = (field, value) => {
    setEditingUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      setIsSavingEdit(true);
      
      // Định dạng ngày cho API (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss)
      let formattedDateOfBirth = editingUser.dateOfBirth;
      if (formattedDateOfBirth && formattedDateOfBirth.length === 10) {
        formattedDateOfBirth = formattedDateOfBirth + 'T00:00:00';
      }
      
      // Gọi API cập nhật hồ sơ qua /userProfile/{id}
      await userAPI.updateUserProfile(editingUser.id, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        phoneNumber: editingUser.phone, // API yêu cầu phoneNumber
        dateOfBirth: formattedDateOfBirth,
        gender: editingUser.gender,
        avatarUrl: editingUser.avatarUrl || editingUser.avatar // Giữ nguyên URL avatar
      });
      
      // Cập nhật state cục bộ
      const updatedUsers = users.map(u => 
        u.id === editingUser.id ? editingUser : u
      );
      setUsers(updatedUsers);
      
      showToast('Cập nhật thông tin người dùng thành công', 'success');
      setShowEditModal(false);
      setEditingUser(null);
      setOriginalEditingUser(null);
    } catch (error) {
      showToast(translateErrorMessage(error), 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    if (isEditingMode) {
      // Trong chế độ chỉnh sửa: khôi phục giá trị gốc và thoát chế độ chỉnh sửa, giữ modal mở
      if (originalEditingUser) {
        setEditingUser(originalEditingUser);
      }
      setIsEditingMode(false);
    } else {
      // Trong chế độ xem: đóng modal và xóa dữ liệu
      setShowEditModal(false);
      setEditingUser(null);
      setOriginalEditingUser(null);
    }
  };

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <div className="user-list-header-title">
          <h2 className="user-list-title">Danh sách người dùng</h2>
          <button 
            className="btn-add-user" 
            title="Thêm người dùng mới"
            onClick={() => onPageChange('manage')}
          >
            <FaPlus />
          </button>
        </div>
        <div className="user-list-controls">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, tên đăng nhập hoặc email..."
            className="user-search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <div className="filter-menu-container" ref={filterMenuRef}>
            <button
              className="filter-menu-button"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              title="Lọc theo trạng thái"
            >
              <FaFilter />
            </button>
            {showFilterMenu && (
              <div className="filter-menu-dropdown">
                <label className="filter-menu-item">
                  <input
                    type="checkbox"
                    checked={filterActive}
                    onChange={handleFilterActiveChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">
                    <FaCheckCircle /> Hoạt động
                  </span>
                </label>
                <label className="filter-menu-item">
                  <input
                    type="checkbox"
                    checked={filterInactive}
                    onChange={handleFilterInactiveChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">
                    <FaBan /> Vô hiệu hóa
                  </span>
                </label>
              </div>
            )}
          </div>
          <button className="refresh-button" onClick={fetchUsers}>
            <FaRedo /> Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <FaSpinner className="spin-icon" /> Đang tải...
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <FaUsers />
          <p>Không có người dùng hoạt động nào</p>
        </div>
      ) : (
        <>
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
                  <td className="col-username" data-label="Tên đăng nhập">{user.username}</td>
                  <td className="col-fullname" data-label="Tên đầy đủ">{user.fullName}</td>
                  <td className="col-email" data-label="Email">{user.email}</td>
                  <td className="col-status" data-label="Trạng thái">
                    <span className={`status-badge status-${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </td>
                  <td className="col-created" data-label="Ngày tạo">{formatCreatedDate(user.createdAt)}</td>
                  <td className="col-actions" data-label="Hành động">
                    <div className="action-buttons">
                      <button 
                        className="btn-edit" 
                        title="Xem"
                        onClick={() => handleEditUser(user)}
                      >
                        <FaEye />
                      </button>
                      <button
                        className={`btn-lock ${
                          !user.isActive ? 'btn-lock-active' : 'btn-lock-inactive'
                        }`}
                        title={!user.isActive ? 'Khôi phục' : 'Xóa'}
                        onClick={() => handleLockToggle(user.id)}
                        disabled={isDeactivating}
                      >
                        {!user.isActive ? <FaLockOpen /> : <FaLock />}
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
        </div>

        <div className="user-list-footer">
          <div className="pagination-info">
            <p>
              {filteredUsers.length > 0 ? (
                <>
                  <strong>{startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}</strong> trên tổng số <strong>{filteredUsers.length}</strong> người dùng
                </>
              ) : (
                <>Tổng cộng: <strong>0</strong> người dùng</>
              )}
            </p>
          </div>
          {filteredUsers.length > itemsPerPage && (
            <div className="pagination-controls">
              <button
                className="pagination-button"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                title="Trang đầu"
              >
                <FaStepBackward />
              </button>
              <button
                className="pagination-button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                title="Trang trước"
              >
                <FaChevronLeft /> 
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
                <FaChevronRight />
              </button>
              <button
                className="pagination-button"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                title="Trang cuối"
              >
                <FaStepForward />
              </button>
            </div>
          )}
        </div>
        </>
      )}
      
      {/* Modal xác nhận vô hiệu hóa/khôi phục */}
      {showConfirmModal && lockActionType && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>
              {lockActionType === 'deactivate' 
                ? 'Bạn có chắc chắn muốn vô hiệu hóa người dùng này?'
                : 'Bạn có chắc chắn muốn khôi phục người dùng này?'
              }
            </p>
            <div className="modal-buttons">
              <button
                className="cancel-button"
                onClick={cancelLockToggle}
                disabled={isDeactivating}
              >
                Hủy
              </button>
              <button
                className="confirm-button"
                onClick={confirmLockToggle}
                disabled={isDeactivating}
              >
                {isDeactivating ? '...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa người dùng */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content edit-user-modal">
            <h3 className="modal-header">Thông tin chi tiết người dùng</h3>
            
            <div className="edit-user-form">
              <div className="form-group">
                <label>Tên đăng nhập</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.username}
                  className="form-input"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Tên đầy đủ</label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                  className="form-input"
                  readOnly={!isEditingMode}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => handleEditInputChange('email', e.target.value)}
                  className="form-input"
                  readOnly={!isEditingMode}
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  value={editingUser.phone || ''}
                  onChange={(e) => handleEditInputChange('phone', e.target.value)}
                  className="form-input"
                  placeholder="Nhập số điện thoại"
                  readOnly={!isEditingMode}
                />
              </div>

              <div className="form-group">
                <label>Ngày sinh</label>
                <input
                  type="date"
                  value={editingUser.dateOfBirth || ''}
                  onChange={(e) => handleEditInputChange('dateOfBirth', e.target.value)}
                  className="form-input"
                  readOnly={!isEditingMode}
                />
              </div>

              <div className="form-group">
                <label>Giới tính</label>
                <select
                  value={editingUser.gender || ''}
                  onChange={(e) => handleEditInputChange('gender', e.target.value)}
                  className="form-input"
                  style={{ height: '45px', padding: '0.75rem 1rem', cursor: isEditingMode ? 'pointer' : 'default' }}
                  disabled={!isEditingMode}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="modal-buttons">
              {isEditingMode ? (
                <>
                  <button
                    className="cancel-button"
                    onClick={handleCancelEdit}
                    disabled={isSavingEdit || isLoadingProfile}
                  >
                    Hủy
                  </button>
                  <button
                    className="confirm-button"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit || isLoadingProfile}
                  >
                    {isSavingEdit ? '...' : 'Lưu'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="cancel-button"
                    onClick={handleCancelEdit}
                  >
                    Đóng
                  </button>
                  <button
                    className="confirm-button"
                    onClick={handleEnterEditMode}
                    disabled={isLoadingProfile}
                  >
                    {isLoadingProfile ? '...' : 'Chỉnh sửa'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserList;
