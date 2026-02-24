import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../presentation/hooks/useAuth';
import { useUser } from '../../presentation/hooks/useUser';
import { useToast } from '../../hooks/useToast';
import { getUserFromToken } from '../../config/TokenHelper';
import { STORAGE_TOKEN, STORAGE_USER, STORAGE_REFRESH_TOKEN } from '../../config/constants';
import PersonalInfo from './PersonalInfor/PersonalInfo';
import StatisticsPage from './StatisticsPage/StatisticsPage';
import CreateUser from './ManageProfile/CreateUser';
import UserList from './ManageProfile/UserList';
import InputWorkDay from './InputWorkDay/InputWorkDay';
import WorkDayTable from './ViewWorkDayTable/WorkDayTable';
import Sidebar from './Sidebar/Sidebar';
import Topbar from './Topbar/Topbar';
import './Main.css';

function Main() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const hasRedirectedRef = useRef(false);
  const { loadProfile, loadProfileMe } = useUser();

  useEffect(() => {
    const userInfo = getUserFromToken();
    
    if (!userInfo) {
      navigate('/');
    } else {
      setUser(userInfo);
      
      // Fetch user profile từ /api/userProfile/me để lấy fullName và avatar
      loadProfileMe()
        .then((profileData) => {
          // Merge profile data vào user state
          setUser(prev => ({
            ...prev,
            fullName: profileData.fullName || profileData.full_name || prev.username
          }));
          
          // Set avatar if available
          if (profileData.avatarUrl) {
            setAvatar(profileData.avatarUrl);
          }
        })
        .catch((err) => {
          console.error('❌ Lỗi lấy profile:', err);
          // Fallback: sử dụng username nếu không lấy được fullName
          setUser(prev => ({
            ...prev,
            fullName: prev.username
          }));
        });
    }
  }, [navigate, loadProfileMe]);

  // 🔴 Lắng nghe tokenExpired event - redirect ngay lập tức
  useEffect(() => {
    const handleTokenExpired = () => {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        setIsTokenValid(false);
        toast.showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error');
        navigate('/');
      }
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    return () => window.removeEventListener('tokenExpired', handleTokenExpired);
  }, [navigate, toast]);

  // 🔴 Lắng nghe BroadcastChannel từ các tab khác - redirect ngay
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('auth-channel');
      channel.onmessage = (event) => {
        if (event.data.type === 'TOKEN_EXPIRED') {
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            setIsTokenValid(false);
            navigate('/');
          }
        }
      };
      return () => channel.close();
    } catch (error) {
      console.warn('BroadcastChannel không được hỗ trợ');
    }
  }, [navigate]);

  // 🔴 Lắng nghe storage event - redirect ngay khi token bị xóa
  useEffect(() => {
    const handleStorageChange = (e) => {
      if ((e.key === STORAGE_TOKEN && e.newValue === null) || 
          (e.key === 'logout-event' && e.newValue !== null)) {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          setIsTokenValid(false);
          navigate('/');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  const handleAvatarChange = (data) => {
    // Handle URL string from AvatarUploadModal
    if (typeof data === 'string') {
      setAvatar(data);
      return;
    }

    // Handle file input event (original behavior)
    const file = data.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    
    try {
      const profileData = await loadProfileMe();
      setUser(prev => ({
        ...prev,
        fullName: profileData.fullName || profileData.full_name || prev.username
      }));
      if (profileData.avatarUrl) {
        setAvatar(profileData.avatarUrl);
      }
    } catch (err) {
      console.error('❌ Lỗi tải lại hồ sơ:', err);
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <StatisticsPage />;
      case 'profile':
        return <PersonalInfo onAvatarChange={handleAvatarChange} onProfileUpdate={handleProfileUpdate} />;
      case 'manage':
        return <CreateUser />;
      case 'manage-grant':
        return <CreateUser />;
      case 'manage-users':
        return <UserList />;
      case 'input':
        return <InputWorkDay />;
      case 'view':
        return <WorkDayTable />;
      default:
        return <StatisticsPage />;
    }
  };

  // ❌ Nếu token không valid, không render gì - queue redirect
  if (!isTokenValid) {
    return null;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false);
        }} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-wrapper">
        <Topbar 
          user={user} 
          avatar={avatar} 
          onAvatarChange={handleAvatarChange} 
          currentPage={currentPage}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSidebarOpen(false);
          }}
          sidebarOpen={sidebarOpen}
        />
        <main className="main-content">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
}

export default Main;



