import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../presentation/hooks/useAuth';
import { useUser } from '../../presentation/hooks/useUser';
import { useToast } from '../../hooks/useToast';
import { getUserFromToken } from '../../config/TokenHelper';
import { STORAGE_TOKEN, STORAGE_USER, STORAGE_REFRESH_TOKEN, getLoginRedirectUrl, resolveWorkdayAssetUrl } from '../../config/constants';
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
  const [isVerifying, setIsVerifying] = useState(true); // Loading state để verify token qua API
  const navigate = useNavigate();
  const toast = useToast();
  const hasRedirectedRef = useRef(false);
  const { loadProfile, loadProfileMe } = useUser();

  const redirectToLoginOnExpiredSession = () => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    setIsTokenValid(false);
    sessionStorage.setItem('auth-expired-toast', '1');
    localStorage.clear();
    window.location.href = getLoginRedirectUrl();
  };

  const isTokenRelatedError = (err) => {
    const errorMsg = err?.message?.toLowerCase() || '';
    return (
      errorMsg.includes('token') ||
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('401') ||
      errorMsg.includes('403') ||
      errorMsg.includes('redirecting') ||
      errorMsg.includes('no user found')
    );
  };

  const handleProtectedPageChange = async (page) => {
    const userInfo = getUserFromToken();
    if (!userInfo) {
      redirectToLoginOnExpiredSession();
      return;
    }

    try {
      // Verify token với server trước khi cho đổi trang
      await loadProfileMe();
      setCurrentPage(page);
      setSidebarOpen(false);
    } catch (err) {
      if (isTokenRelatedError(err)) {
        redirectToLoginOnExpiredSession();
        return;
      }
      // Lỗi thường (network, timeout...) vẫn cho đổi trang
      setCurrentPage(page);
      setSidebarOpen(false);
    }
  };

  // Chủ động giám sát token trong cùng tab để tránh trạng thái sidebar mất menu nhưng chưa redirect
  useEffect(() => {
    const checkClientSession = () => {
      if (hasRedirectedRef.current) return;

      const userInfo = getUserFromToken();
      if (!userInfo) {
        redirectToLoginOnExpiredSession();
      }
    };

    const handleVisibilityOrFocus = () => {
      checkClientSession();
    };

    // Check ngay khi effect mount
    checkClientSession();

    // Poll nhẹ để bắt case token bị clear trong cùng tab
    const intervalId = setInterval(checkClientSession, 1000);

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  useEffect(() => {
    const userInfo = getUserFromToken();
    
    if (!userInfo) {
      navigate('/');
      setIsVerifying(false);
    } else {
      setUser(userInfo);
      
      // Fetch user profile từ /api/userProfile/me để lấy fullName và avatar
      // Đồng thời verify token còn valid ở server không
      loadProfileMe()
        .then((profileData) => {
          // Merge profile data vào user state
          setUser(prev => ({
            ...prev,
            fullName: profileData.fullName || profileData.full_name || prev.username
          }));
          
          // Set avatar if available
          if (profileData.avatarUrl) {
            setAvatar(resolveWorkdayAssetUrl(profileData.avatarUrl));
          }
          
          // Token valid - cho phép render UI
          setIsVerifying(false);
        })
        .catch((err) => {
          // Nếu lỗi liên quan đến token (401, unauthorized, revoked, expired)
          // → Redirect ngay, KHÔNG fallback vào username
          if (isTokenRelatedError(err)) {
       
            redirectToLoginOnExpiredSession();
          } else {
            // Các lỗi khác (network, etc.) → Fallback vào username
            setUser(prev => ({
              ...prev,
              fullName: prev.username
            }));
            setIsVerifying(false);
          }
        });
    }
  }, [navigate, loadProfileMe]);

  // 🔴 Lắng nghe tokenExpired event - redirect ngay lập tức
  useEffect(() => {
    const handleTokenExpired = () => {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        setIsTokenValid(false);
        toast.showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'warning');
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
      setAvatar(resolveWorkdayAssetUrl(data));
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
        setAvatar(resolveWorkdayAssetUrl(profileData.avatarUrl));
      }
    } catch (err) {
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
        return <UserList onPageChange={handleProtectedPageChange} />;
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

  // ⏳ Đang verify token qua API - hiển thị loading hoặc không render gì
  if (isVerifying) {
    return null; // Hoặc có thể return <LoadingSpinner /> nếu muốn
  }

  return (
    <div className="dashboard-layout">
      <Sidebar 
        currentPage={currentPage} 
          onPageChange={handleProtectedPageChange}
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
          onPageChange={handleProtectedPageChange}
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



