import { useAuth } from "../../../presentation/hooks/useAuth";
import { getUserRole } from "../../../config/PermissionHelper";
import {
  STORAGE_USER,
  STORAGE_TOKEN,
  STORAGE_REFRESH_TOKEN,
} from "../../../config/constants";
import "./Topbar.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LockIcon,
  LogoutIcon,
  ChevronDownIcon,
  MenuIcon,
} from "../../../utils/Icons";
import { FaUser } from "react-icons/fa";

function Topbar({
  user,
  avatar,
  onAvatarChange,
  currentPage,
  onMenuClick,
  onPageChange,
  sidebarOpen,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Biểu đồ thống kê" },
    { id: "manage", label: "Quản lý tài khoản" },
    { id: "input", label: "Nhập ngày công" },
    { id: "view", label: "Xem bảng lương" },
    { id: "profile", label: "Thông tin cá nhân" },
    { id: "manage-grant", label: "Cấp tài khoản" },
    { id: "manage-users", label: "Danh sách người dùng" },
  ];

  const currentPageLabel =
    menuItems.find((item) => item.id === currentPage)?.label || "Quản lý";

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_REFRESH_TOKEN);
      navigate("/");
    } catch (error) {
      navigate("/");
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
                    {user?.fullName?.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <span className="username">{user?.fullName || "User"}</span>
              <span className="dropdown-icon">
                <ChevronDownIcon />
              </span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onPageChange("profile");
                    setShowUserMenu(false);
                  }}
                >
                  <FaUser />
                  <span>Thông tin cá nhân</span>
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    navigate("/change-password");
                    setShowUserMenu(false);
                  }}
                >
                  <LockIcon />
                  <span>Đổi mật khẩu</span>
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogoutIcon />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
