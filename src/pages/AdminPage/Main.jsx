import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, cookieManager, getUserFromToken } from '../../services/auth';
import { getUserRole } from '../../services/permissions';
import { STORAGE_TOKEN, STORAGE_USER, STORAGE_REFRESH_TOKEN } from '../../services/constants';
import ProfilePage from './ProfilePage';
import './Main.css';

function Main() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    debugger;
    // Get user info from access token
    const userInfo = getUserFromToken();
    
    console.log('🔍 Main - Checking auth:');
    console.log('  userInfo:', userInfo);
    
    if (!userInfo) {
      console.log('❌ Redirecting to login: no userInfo');
      // Redirect to login if no token or invalid token
      navigate('/');
    } else {
      console.log('✅ Setting user, allowing access');
      setUser(userInfo);
    }
  }, [navigate]);

  const handleLogout = async () => {
    debugger;
    try {
      // Get refresh token from localStorage (saved during login)
      const refreshToken = localStorage.getItem(STORAGE_REFRESH_TOKEN);
      const accessToken = localStorage.getItem(STORAGE_TOKEN);
      
      console.log('🔓 Logout details:');
      console.log('  refreshToken from localStorage:', !!refreshToken);
      console.log('  accessToken from localStorage:', !!accessToken);
      
      // Call backend logout API
      if (refreshToken) {
        console.log('📤 Calling logout API with refreshToken...');
        await authAPI.logout(refreshToken);
        console.log('✅ Backend logout successful');
      } else {
        console.log('⚠️  No refreshToken found, doing local logout only');
      }
    } catch (error) {
      console.error('❌ Logout API error:', error);
      // Vẫn tiếp tục logout local even nếu API error
    } finally {
      // Clear all auth data from localStorage
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_REFRESH_TOKEN);
      
      // Debug log
      console.log('✅ Local logout thành công!');
      console.log('🗑️  Cleared localStorage: user, token, refreshToken');
      
      // Redirect to login
      navigate('/');
    }
  };

  return (
    <div className="main-container">
      <header className="main-header">
        <h1>Chào, {user?.username || 'User'}! - {user ? getUserRole() : ''}</h1>
        <div className="user-info">
          {user?.email && <span>{user.email}</span>}
          <button onClick={handleLogout} className="logout-btn">
            Đăng xuất
          </button>
        </div>
      </header>
      
      <main className="main-content"> 
        <ProfilePage />
      </main>
    </div>
  );
}

export default Main;
