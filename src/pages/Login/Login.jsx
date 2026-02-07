import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, decodeToken } from '../../services/auth';
import { STORAGE_TOKEN, STORAGE_USER, STORAGE_REFRESH_TOKEN } from '../../services/constants';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(username, password);
      
      // DEBUG - Log full response structure
      console.log('🔐 Full Login Response:', response);
      console.log('📋 Response properties:', Object.keys(response));
      console.log('- message:', response.message);
      console.log('- token:', response.token);
      console.log('- accessToken:', response.accessToken);
      
      // Check for login success (try both 'token' and 'accessToken' fields)
      const token = response.token || response.accessToken;
      
      if (response.message === 'Login successful.' && token) {
        console.log('✅ Login successful!');
        
        // Lưu access token
        localStorage.setItem(STORAGE_TOKEN, token);
        
        // Lưu refresh token từ response nếu có
        if (response.refreshToken) {
          console.log('💾 Saving refreshToken...');
          localStorage.setItem(STORAGE_REFRESH_TOKEN, response.refreshToken);
        }
        
        // Decode token để lấy thông tin user
        const decoded = decodeToken(token);
        console.log('🔓 Decoded Token:', decoded);
        
        if (decoded && decoded.unique_name) {
          // Lưu user info từ token
          localStorage.setItem(STORAGE_USER, JSON.stringify({
            id: decoded.sub,
            username: decoded.unique_name,
            email: decoded.email,
            permissions: decoded.permissions || [],
          }));
          
          console.log('🎯 Redirecting to /main...');
          // Chuyển đến trang admin
          navigate('/main', { replace: true });
        } else {
          throw new Error('Invalid token format');
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      alert(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      <h2>Phần mềm quản lý ngày công</h2>
      <form  onSubmit={handleSubmit}>
        <div className="txt_field" style={{ cursor: 'pointer' }}>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          
          />
          <span></span>
          <label htmlFor="username">Tên đăng nhập</label>
        </div>
        <div className="txt_field">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <span></span>
          <label htmlFor="password">Mật khẩu</label>
        </div>
        <div className="pass">Quên mật khẩu?</div>
        <input 
          type="submit" 
          value={loading ? "Đang đăng nhập..." : "Đăng nhập"} 
          style={{marginBottom: '50px'}}
          disabled={loading}
        />
       
      </form>
    </div>
  );
}

export default Login;
