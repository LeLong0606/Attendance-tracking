import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../presentation/hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { translateErrorMessage } from '../../utils/errorHandler';
import './Login.css';

/**
 * Login Page
 * Trang đăng nhập người dùng
 */
function Login() {
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);
  
  // Lấy auth functions từ custom hook
  const { login, loading, error } = useAuth();
  const { showToast } = useToast();

  /**
   * Xử lý submit form đăng nhập
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Lấy giá trị trực tiếp từ form elements
    const formData = new FormData(formRef.current);
    const usernameValue = formData.get('username');
    const passwordValue = formData.get('password');

    // Kiểm tra nhập liệu`
    if (!usernameValue || !passwordValue) {
      showToast('Vui lòng nhập tên đăng nhập và mật khẩu', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      // Gọi login use case từ hook
      const result = await login(usernameValue, passwordValue);
      
      // Kiểm tra xem có cần đổi mật khẩu không
      if (result?.requirePasswordChange) {
        showToast('Vui lòng đổi mật khẩu để tiếp tục.', 'warning'); 
        // Delay slightly to show toast
        setTimeout(() => {
          navigate('/change-password', { replace: true });  
        }, 500);
      } else if (result?.success) {
        showToast('Đăng nhập thành công!', 'success');
       
          navigate('/main', { replace: true });
       
      }
    } catch (error) {
      setIsSubmitting(false);
      showToast(translateErrorMessage(error), 'error');
    }
  };

  return (
    <div className="center">
      <h2>Phần mềm quản lý ngày công</h2>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="txt_field">
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            disabled={loading}
          />
          <span></span>
          <label htmlFor="username" className={isSubmitting ? 'hidden-animation' : ''}>Tên đăng nhập</label>
        </div>
        <div className="txt_field password-field">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            autoComplete="current-password"
            required
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-password"
            title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
          >
            <i className="fa-solid fa-eye"></i>
          </button>
          <span></span>
          <label htmlFor="password" className={isSubmitting ? 'hidden-animation' : ''}>Mật khẩu</label>
        </div>
        {/* <div className="pass">Quên mật khẩu?</div> */}
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{translateErrorMessage(error)}</div>}
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