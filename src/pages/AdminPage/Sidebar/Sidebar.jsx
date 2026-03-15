import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  getUserRole, 
  isAdmin, 
  isHR,
  hasManageAccountAccess,
  hasInputWorkDayAccess,
  hasViewWorkDayAccess,
} from '../../../config/PermissionHelper';
import { USER_ROLES } from '../../../config/constants';
import { StatisticsIcon, UsersIcon, DocumentIcon, ClipboardListIcon } from '../../../utils/Icons';
import { FaBars, FaChevronDown } from 'react-icons/fa';
import './Sidebar.css';

function Sidebar({ currentPage, onPageChange, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = getUserRole();
  // Track mỗi submenu riêng biệt: { 'manage': true/false, 'manage-workday': true/false, ... }
  const [expandedDropdowns, setExpandedDropdowns] = useState({});

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Biểu đồ thống kê', 
      Icon: StatisticsIcon, 
      checkAccess: isAdmin,
    },
    {
      id: 'manage',
      label: 'Quản lý tài khoản',
      Icon: UsersIcon,
      checkAccess: hasManageAccountAccess,
      hasDropdown: true,
      submenu: [
        { id: 'manage-grant', label: 'Cấp tài khoản', checkAccess: hasManageAccountAccess },
        { id: 'manage-users', label: 'Danh sách người dùng', checkAccess: hasManageAccountAccess },
      ],
    },
    {
      id: 'manage-workday',
      label: 'Quản lý ngày công',
      Icon: ClipboardListIcon,
      checkAccess: hasViewWorkDayAccess,
      hasDropdown: true,
      submenu: [
        { id: 'input', label: 'Nhập liệu ngày công', Icon: DocumentIcon, checkAccess: hasInputWorkDayAccess },
        { id: 'view', label: 'Xem bảng lương', Icon: ClipboardListIcon, checkAccess: hasViewWorkDayAccess },
      ],
    },
  ];

  const filteredItems = menuItems.filter(item => item.checkAccess?.());

  const handleItemClick = (id) => {
    if (menuItems.find((item) => item.id === id)?.hasDropdown) {
      // Toggle dropdown cho menu item này
      setExpandedDropdowns(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    } else {
      onPageChange(id);
    }
  };

  const handleSubMenuClick = (id) => {
    // Mở submenu khi click vào submenu item
    const parentItem = menuItems.find(item => item.hasDropdown && item.submenu?.some(sub => sub.id === id));
    if (parentItem) {
      setExpandedDropdowns(prev => ({
        ...prev,
        [parentItem.id]: true
      }));
    }
    onPageChange(id);
  };

  // Check if a menu item's submenu contains the current page
  const isSubmenuItemActive = (item) => {
    return item.hasDropdown && item.submenu?.some(sub => 
      sub.id === currentPage && sub.checkAccess?.()
    );
  };

  // Auto-mở submenu parent khi navigate đến submenu item
  useEffect(() => {
    // Tìm submenu parent của current page
    const parentItem = menuItems.find(item => isSubmenuItemActive(item));
    if (parentItem) {
      setExpandedDropdowns(prev => ({
        ...prev,
        [parentItem.id]: true
      }));
    }
  }, [currentPage]);

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
            <span className="logo-icon"><FaBars /></span>
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
                    expandedDropdowns[item.id] ? 'expanded' : ''
                  }`}
                >
                  <div className="nav-item-content">
                    <span className="nav-icon"><item.Icon /></span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  {item.hasDropdown && (
                    <span className={`dropdown-arrow ${expandedDropdowns[item.id] ? 'open' : ''}`}>
                      <FaChevronDown />
                    </span>
                  )}
                </button>

                {/* Dropdown submenu */}
                {item.hasDropdown && expandedDropdowns[item.id] && item.submenu && (
                  <div className="dropdown-menu">
                    {item.submenu.filter(subitem => subitem.checkAccess?.()).map((subitem) => (
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
