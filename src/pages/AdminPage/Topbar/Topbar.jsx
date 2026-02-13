import { useAuth } from '../../../presentation/hooks/useAuth';
import { getUserRole } from '../../../config/PermissionHelper';
import { STORAGE_USER, STORAGE_TOKEN, STORAGE_REFRESH_TOKEN } from '../../../config/constants';
import './Topbar.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from './ChangePasswordModal';
import AvatarUploadModal from './AvatarUploadModal';
import { CameraIcon, LockIcon, LogoutIcon, ChevronDownIcon, MenuIcon } from '../../../utils/Icons';

function Topbar({ user, avatar, onAvatarChange, currentPage, onMenuClick, onPageChange, sidebarOpen }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Biểu đồ thống kê' },
    { id: 'manage', label: 'Quản lý tài khoản' },
    { id: 'input', label: 'Nhập ngày công' },
    { id: 'view', label: 'Xem ngày công'  },
     { id: 'profile' , label: 'Thông tin cá nhân' },
   
  ];

  const currentPageLabel = menuItems.find(item => item.id === currentPage)?.label || 'Quản lý';

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_REFRESH_TOKEN);
      navigate('/');
    } catch (error) {
      navigate('/');
    }
  };

  const handleAvatarUpload = async (imageData) => {
    try {
      // Tạo event object giả để tương thích với onAvatarChange
      const mockEvent = {
        target: {
          files: [new File([imageData], 'avatar.png', { type: 'image/png' })]
        }
      };
      onAvatarChange(mockEvent);
      setShowUserMenu(false);

    } catch (error) {

      alert('Lỗi khi thay đổi ảnh đại diện');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-content">
        <div className="topbar-left">
          <button 
            className="menu-toggle"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
            title="Menu"
          >
            <MenuIcon />
         
          </button>
          <h2 className="topbar-title">{currentPageLabel}</h2>
        </div>

        <div className="topbar-right">
          <div className="user-menu">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="avatar-frame">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="avatar-img" />
                ) : (
                  <span className="avatar-initial">
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <span className="username">{user?.fullName || 'User'}</span>
              <span className="dropdown-icon"><ChevronDownIcon /></span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    onPageChange('profile');
                    setShowUserMenu(false);
                  }}
                >
                  <i className="fa-solid fa-user"></i>
                  <span>Thông tin cá nhân</span>
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    setShowAvatarModal(true);
                    setShowUserMenu(false);
                  }}
                >
                  <CameraIcon />
                  <span>Thay đổi ảnh đại diện</span>
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    setShowPasswordModal(true);
                    setShowUserMenu(false);
                  }}
                >
                  <LockIcon />
                  <span>Đổi mật khẩu</span>
                </button>
                <button 
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  <LogoutIcon />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <AvatarUploadModal 
        isOpen={showAvatarModal} 
        onClose={() => setShowAvatarModal(false)} 
        onUpload={handleAvatarUpload}
        currentAvatar={avatar}
      />
    </header>
  );
}

export default Topbar;
