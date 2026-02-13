import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRole } from '../../../config/PermissionHelper';
import { USER_ROLES } from '../../../config/constants';
import { StatisticsIcon, UsersIcon, DocumentIcon, ClipboardListIcon } from '../../../utils/Icons';
import './Sidebar.css';

function Sidebar({ currentPage, onPageChange, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = getUserRole();
  const isAdmin = userRole === USER_ROLES.ADMIN;

  const menuItems = [
    { id: 'dashboard', label: 'Biểu đồ thống kê', Icon: StatisticsIcon, role: 'admin' },
    { id: 'manage', label: 'Quản lý tài khoản', Icon: UsersIcon, role: 'admin' },
    { id: 'input', label: 'Nhập ngày công', Icon: DocumentIcon, role: 'admin' },
    { id: 'view', label: 'Xem ngày công', Icon: ClipboardListIcon, role: 'all' },
  ];

  const filteredItems = menuItems.filter(
    (item) => item.role === 'all' || (item.role === 'admin' && isAdmin)
  );

  const handleItemClick = (id) => {
    onPageChange(id);
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
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              >
                <span className="nav-icon"><item.Icon /></span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
