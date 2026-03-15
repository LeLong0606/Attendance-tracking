import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../presentation/hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getTempToken } from '../../config/TokenHelper';
import { translateErrorMessage } from '../../utils/errorHandler';
import { FaEye } from 'react-icons/fa';
import './InitChangePassword.css';

const PasswordInputWithToggle = ({ value, onChange, showPassword, onToggle, placeholder }) => (
  <div style={{ position: "relative", width: "100%" }}>
    <input
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      autoComplete="off"
      placeholder={placeholder}
      style={{
        width: "100%",
        height: "40px",
        padding: "0 40px 0 10px",
        fontSize: "14px",
        border: "1.5px solid #dbdfe6",
        borderRadius: "6px",
        transition: "all 0.2s ease",
        boxSizing: "border-box"
      }}
    />
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      style={{
        position: "absolute",
        right: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "18px",
        color: "#667eea",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto"
      }}
    >
      <FaEye />
    </button>
  </div>
);

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { changePassword, changeInitialPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Detect if this is initial password change
  const tempToken = getTempToken();
  const isInitialPasswordChange = !!tempToken;

  const handleChangePassword = async () => {
    // Validate inputs
    if (isInitialPasswordChange) {
      // For initial password change, only need new password
      if (!newPassword || !confirmPassword) {
        showToast("Vui lòng nhập đầy đủ mật khẩu mới.", "warning");
        return;
      }
    } else {
      // For regular password change, need current password
      if (!currentPassword || !newPassword || !confirmPassword) {
        showToast("Vui lòng nhập đầy đủ mật khẩu.", "warning");
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu mới không khớp.", "error");
      return;
    }

    try {
      setLoading(true);
      
      if (isInitialPasswordChange) {
        // Change initial password using temp token
        const result = await changeInitialPassword(newPassword, confirmPassword);
        showToast(result.message || "Đổi mật khẩu thành công!", "success");
        
        // Nếu backend chưa trả access token thì về login, đồng thời chặn toast hết phiên cho case đặc biệt này
        if (!result?.hasAccessToken) {
          sessionStorage.setItem('skip-auth-expired-toast', '1');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
          return;
        }

        // Navigate to main after delay
        setTimeout(() => {
          navigate('/main', { replace: true });
        }, 1500);
      } else {
        // Regular password change
        await changePassword(currentPassword, newPassword, confirmPassword);
        showToast("Đổi mật khẩu thành công!", "success");
        
        // Navigate to main after delay
        setTimeout(() => {
          navigate('/main', { replace: true });
        }, 1500);
      }
    } catch (error) {
      showToast(translateErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isInitialPasswordChange) {
      // Can't cancel initial password change, go back to login
      navigate('/', { replace: true });
    } else {
      // Can cancel regular change
      navigate('/main', { replace: true });
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-box">
        <h1 className="change-password-title">
          {isInitialPasswordChange ? "Đổi mật khẩu lần đầu" : "Đổi mật khẩu"}
        </h1>

        <div className="form-content">
          {!isInitialPasswordChange && (
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <PasswordInputWithToggle
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                showPassword={showCurrentPassword}
                onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
          )}

          <div className="form-group">
            <label>Mật khẩu mới</label>
            <PasswordInputWithToggle
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showPassword={showNewPassword}
              onToggle={() => setShowNewPassword(!showNewPassword)}
              placeholder="Nhập mật khẩu mới"
            />
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu mới</label>
            <PasswordInputWithToggle
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              showPassword={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
        </div>

        <div className="form-buttons">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="cancel-btn"
          >
            {isInitialPasswordChange ? "Quay lại" : "Hủy"}
          </button>
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="confirm-btn"
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
