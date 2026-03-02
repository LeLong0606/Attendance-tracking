import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../../hooks/useToast';
import { userAPI } from '../../../services/api';
import { translateErrorMessage } from '../../../config/constants';
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

  // Close filter menu when clicking outside
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

  // Fetch user profile when modal opens
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

  // Filter users based on search term and status
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter - show based on checked boxes
    const matchesStatus = 
      (filterActive && filterInactive) || // Both checked: show all
      (filterActive && user.isActive) ||  // Only active checked
      (filterInactive && !user.isActive); // Only inactive checked
    
    return matchesSearch && matchesStatus;
  });

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

  // Handle checkbox filter changes
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
        // User is inactive (green lock) - call restore API
        await userAPI.restoreUser(selectedUserId);
        
        // Update user's isActive status
        const updatedUsers = users.map(u => 
          u.id === selectedUserId ? { ...u, isActive: true } : u
        );
        setUsers(updatedUsers);
        
        showToast('Khôi phục người dùng thành công', 'success');
      } else if (lockActionType === 'deactivate') {
        // User is active (red lock) - call delete API
        await userAPI.deactivateUser(selectedUserId);
        
        // Update user's isActive status
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

  // Helper function to format phone number (show first 3 digits, hide rest with *)
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length <= 3) return phoneStr;
    const firstThree = phoneStr.substring(0, 3);
    const rest = '*'.repeat(phoneStr.length - 3);
    return firstThree + rest;
  };

  // Helper function to format date from API to YYYY-MM-DD
  const formatDateFromAPI = (dateValue) => {
    if (!dateValue) return '';
    
    const value = dateValue.toString().trim();
    
    // Trường hợp format: YYYY-MM-DDTHH:mm:ss
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    
    // Trường hợp format lộn xộn như: 30T00:00:00/01/2026 - extract dd/mm/yyyy
    const mixedMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mixedMatch) {
      const [, day, month, year] = mixedMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Trường hợp format: dd/mm/yyyy
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Nếu đã là YYYY-MM-DD, return as-is
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }
    
    return '';
  };

  const formatCreatedDate = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    try {
      const date = new Date(dateTimeString);
      
      // Get time components
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      // Get date components
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch (error) {
      return dateTimeString;
    }
  };

  const handleEditUser = (user) => {
    // Just open modal in view mode with basic user data
    setEditingUser({ ...user });
    setIsEditingMode(false);
    setShowEditModal(true);
  };

  const handleStartEditing = async () => {
    if (!editingUser) return;
    try {
      setIsLoadingProfile(true);
      // Fetch full user profile from /userProfile/{id}
      const profileData = await userAPI.getUserProfile(editingUser.id);
      const userData = profileData.data || profileData;
      
      // Format date from API to YYYY-MM-DD format
      const formattedDob = formatDateFromAPI(userData.dateOfBirth || userData.birthDate || userData.dob || '');
      
      // Map API response fields (handle different field names)
      const mappedUser = {
        ...editingUser,
        ...userData,
        fullName: userData.fullName || editingUser.fullName,
        email: userData.email || editingUser.email,
        phone: userData.phoneNumber || userData.phone || editingUser.phone || '', // API uses phoneNumber
        dateOfBirth: formattedDob, // Use formatted date
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

  // Enter edit mode (after data is loaded)
  const handleEnterEditMode = () => {
    setIsEditingMode(true);
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
      
      // Format date for API (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss)
      let formattedDateOfBirth = editingUser.dateOfBirth;
      if (formattedDateOfBirth && formattedDateOfBirth.length === 10) {
        formattedDateOfBirth = formattedDateOfBirth + 'T00:00:00';
      }
      
      // Call API to update profile via /userProfile/{id}
      await userAPI.updateUserProfile(editingUser.id, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        phoneNumber: editingUser.phone, // API expects phoneNumber
        dateOfBirth: formattedDateOfBirth,
        gender: editingUser.gender,
        avatarUrl: editingUser.avatarUrl || editingUser.avatar // Preserve avatar URL
      });
      
      // Update local state
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
      // In edit mode: Just restore original values and exit edit mode, keep modal open
      if (originalEditingUser) {
        setEditingUser(originalEditingUser);
      }
      setIsEditingMode(false);
    } else {
      // In view mode: Close modal and clear data
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
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
        <div className="user-list-controls">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, username hoặc email..."
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
              <i className="fa-solid fa-filter"></i>
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
                    <i className="fa-solid fa-check-circle"></i> Hoạt động
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
                    <i className="fa-solid fa-ban"></i> Vô hiệu hóa
                  </span>
                </label>
              </div>
            )}
          </div>
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
                  <td className="col-created">{formatCreatedDate(user.createdAt)}</td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button 
                        className="btn-edit" 
                        title="Chỉnh sửa"
                        onClick={() => handleEditUser(user)}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        className={`btn-lock ${
                          !user.isActive ? 'btn-lock-active' : 'btn-lock-inactive'
                        }`}
                        title={!user.isActive ? 'Khôi phục' : 'Xóa'}
                        onClick={() => handleLockToggle(user.id)}
                        disabled={isDeactivating}
                      >
                        <i className={`fa-solid ${!user.isActive ? 'fa-lock-open' : 'fa-lock'}`}></i>
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
      
      {/* Lock Toggle Confirm Modal */}
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content edit-user-modal">
            <h3 className="modal-header">Chỉnh sửa thông tin người dùng</h3>
            
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
                  value={isEditingMode ? (editingUser.phone || '') : formatPhoneNumber(editingUser.phone || '')}
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
