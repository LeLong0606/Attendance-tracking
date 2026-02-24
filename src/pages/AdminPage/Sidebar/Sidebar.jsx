import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { getUserRole } from '../../../config/PermissionHelper';
import { USER_ROLES } from '../../../config/constants';
import { StatisticsIcon, UsersIcon, DocumentIcon, ClipboardListIcon } from '../../../utils/Icons';
import './Sidebar.css';

function Sidebar({ currentPage, onPageChange, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = getUserRole();
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const [expandedDropdown, setExpandedDropdown] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Biểu đồ thống kê', Icon: StatisticsIcon, role: 'admin' },
    {
      id: 'manage',
      label: 'Quản lý tài khoản',
      Icon: UsersIcon,
      role: 'admin',
      hasDropdown: true,
      submenu: [
        { id: 'manage-grant', label: 'Cấp tài khoản' },
        { id: 'manage-users', label: 'Danh sách người dùng' },
      ],
    },
    { id: 'input', label: 'Nhập ngày công', Icon: DocumentIcon, role: 'admin' },
    { id: 'view', label: 'Xem ngày công', Icon: ClipboardListIcon, role: 'all' },
  ];

  const filteredItems = menuItems.filter(
    (item) => item.role === 'all' || (item.role === 'admin' && isAdmin)
  );

  const handleItemClick = (id) => {
    if (menuItems.find((item) => item.id === id)?.hasDropdown) {
      // Toggle dropdown
      setExpandedDropdown(expandedDropdown === id ? null : id);
    } else {
      onPageChange(id);
    }
  };

  const handleSubMenuClick = (id) => {
    onPageChange(id);
    setExpandedDropdown(null); // Close dropdown after selection
  };

  return (
    <>
      {/* Sidebar Overlay for mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" onClick={onClose}>
          <div className="sidebar-logo">
            <span className="logo-icon"><i className="fa-solid fa-bars"></i></span>
            <span className="logo-text">Habitas</span>
          </div>
          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <h3 className="section-title">Quản lý</h3>
            {filteredItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`nav-item ${currentPage === item.id ? 'active' : ''} ${
                    item.hasDropdown && expandedDropdown === item.id ? 'expanded' : ''
                  }`}
                >
                  <div className="nav-item-content">
                    <span className="nav-icon"><item.Icon /></span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  {item.hasDropdown && (
                    <span className={`dropdown-arrow ${expandedDropdown === item.id ? 'open' : ''}`}>
                      <i className="fa-solid fa-chevron-down"></i>
                    </span>
                  )}
                </button>

                {/* Dropdown submenu */}
                {item.hasDropdown && expandedDropdown === item.id && item.submenu && (
                  <div className="dropdown-menu">
                    {item.submenu.map((subitem) => (
                      <button
                        key={subitem.id}
                        onClick={() => handleSubMenuClick(subitem.id)}
                        className={`submenu-item ${currentPage === subitem.id ? 'active' : ''}`}
                      >
                        <span className="submenu-label">{subitem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
