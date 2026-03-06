import { useState, useEffect, useRef } from "react";
import { useUser } from "../../../presentation/hooks/useUser";
import { getUserFromToken } from "../../../config/TokenHelper";
import { useToast } from "../../../hooks/useToast";
import { translateErrorMessage } from "../../../utils/errorHandler";
import { userAPI } from "../../../services/api";
import "./ManageProfile.css";
import PasswordResultModal from "./PasswordResultModal";

function CreateUser() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [useAutoPassword, setUseAutoPassword] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [displayUsername, setDisplayUsername] = useState("");
  const username = useRef(null);
  const passwordFieldRef = useRef(null);
  
  const { showToast } = useToast();

  // Tự động cuộn tới ô mật khẩu khi hiển thị
  useEffect(() => {
    if (!useAutoPassword && passwordFieldRef.current) {
      const timer = setTimeout(() => {
        passwordFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [useAutoPassword]);

  const handleCreateUser = async () => {
    // Nếu không dùng mật khẩu tự động thì bắt buộc nhập mật khẩu
    if (!useAutoPassword && !password.trim()) {
      showToast("Vui lòng nhập mật khẩu.", "warning");
      return;
    }

    try {
     
      let response;
      
      if (useAutoPassword) {
        // Dùng mật khẩu được tạo tự động
        const userData = {
          fullName,
          userName,
          email: email || "",
        };
        response = await userAPI.createUser(userData);
      } else {
        // Dùng mật khẩu nhập thủ công
        const userData = {
          username: userName,
          fullName,
          password,
          email: email || "",
        };
        response = await userAPI.createUserWithPassword(userData);
      }

      // Lấy mật khẩu sinh tự động từ response (hỗ trợ nhiều mức lồng nhau)
      let resultPassword = password;
      if (useAutoPassword) {
        resultPassword = 
          response?.generatedPassword || 
          response?.data?.generatedPassword || 
          password;
      }
      
      setGeneratedPassword(resultPassword);
      setDisplayUsername(userName);
      setOpenModal(false);
      setShowPasswordModal(true);

      // Đặt lại form
      setFullName("");
      setEmail("");
      setUserName("");
      setPassword("");
    } catch (error) {
      showToast(translateErrorMessage(error), "error");
    }
  };

  const openModalHandler = () => {
    // Kiểm tra dữ liệu tên đăng nhập và họ tên (không bắt buộc email)
    if (!userName.trim()) {
      showToast("Vui lòng nhập tên đăng nhập.", "warning");
      return;
    }
    
    if (!fullName.trim()) {
      showToast("Vui lòng nhập họ và tên.", "warning");
      return;
    }

    setOpenModal(true);
  };

  const closeModalHandler = () => {
    setOpenModal(false);
  };

  const closePasswordModalHandler = () => {
    setShowPasswordModal(false);
    setDisplayUsername("");
  };

  function Modal() {
    return (
      <div className="modal-overlay create-user-confirmation">
        <div className="modal-content">
          <p>Bạn có chắc muốn tạo tài khoản mới?</p>
          <div className="modal-buttons">
            <button className="cancel-button" onClick={closeModalHandler}>
              Hủy
            </button>
            <button className="confirm-button" onClick={handleCreateUser}>
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fullNameChange = (e) => {
    setFullName(e.target.value);
  };

  const emailChange = (e) => {
    setEmail(e.target.value);
  };

  const userNameChange = (e) => {
    const rawValue = e.target.value;
    
    // Kiểm tra ký tự có dấu tiếng Việt
    const hasVietnameseMark = /[\u0300-\u036f]|[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(rawValue);
    
    // Kiểm tra khoảng trắng
    const hasWhitespace = /\s/.test(rawValue);
    
    // Hiển thị cảnh báo nếu nhập dấu tiếng Việt hoặc khoảng trắng
    if (hasVietnameseMark) {
      showToast('Tên đăng nhập không được chứa dấu tiếng Việt', 'warning');
    }
    if (hasWhitespace) {
      showToast('Tên đăng nhập không được chứa khoảng trắng', 'warning');
    }
    
    // Xử lý giá trị: loại bỏ dấu tiếng Việt và khoảng trắng
    const value = rawValue
      .normalize('NFD') // Tách dấu ra khỏi ký tự
      .replace(/[\u0300-\u036f]/g, '') // Xóa dấu diacritical của tiếng Việt
      .replace(/\s/g, ''); // Xóa khoảng trắng
    
    setUserName(value);
  };

  const passwordChange = (e) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  return (
    <div className="manage-profile-container">
      <div className="create-user-header">
        <div className="header-icon">
          <i className="fa-solid fa-user-plus"></i>
        </div>
        <div className="header-content">
          <h2 className="header-title">Thêm thành viên mới</h2>
          <p className="header-subtitle">Điền thông tin để cấp tài khoản truy cập hệ thống</p>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="userName">Tên đăng nhập (Username) <span className="required">*</span></label>
          <input
            ref={username}
            id="userName"
            value={userName}
            onChange={userNameChange}
            className="form-input"
            placeholder="Nhập tên đăng nhập"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fullName">Họ và tên <span className="required">*</span></label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={fullNameChange}
            className="form-input"
            placeholder="Nhập họ và tên đầy đủ"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="email">
            Email liên hệ
            <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '300', marginLeft: '0.25rem' }}>
              (Không bắt buộc)
            </span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={emailChange}
            className="form-input"
            placeholder="example@domain.com (Không bắt buộc)"
          />
        </div>
      </div>

      <div className="checkbox-group">
        <input
          type="checkbox"
          id="autoPassword"
          checked={useAutoPassword}
          onChange={() => {
            setUseAutoPassword(!useAutoPassword);
          }}
          className="checkbox-input"
        />
        <label htmlFor="autoPassword" className="checkbox-label">
          Tự động tạo mật khẩu
        </label>
      </div>

      {!useAutoPassword ? (
        <div className="password-field-section" ref={passwordFieldRef}>
          <div className="form-group">
            <label htmlFor="password">Cấp mật khẩu truy cập</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}  
                onChange={passwordChange}
                className="form-input"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </button>
            </div>
          </div>
        </div>
      ) : (<div className="error-message-box">
        <i className="fa-solid fa-circle-info"></i>
        <span> Mật khẩu này chỉ tạo 1 lần duy nhất. Vui lòng ghi chú lại ở bước tiếp theo.</span>
      </div>) }



      <div className="button-container">
      
        <button className="create-button" onClick={openModalHandler}>
          <i className="fa-solid fa-check"></i>
          Lưu thành viên
        </button>
      </div>
      {openModal && <Modal />}
      <PasswordResultModal 
        isOpen={showPasswordModal} 
        password={generatedPassword} 
        username={displayUsername}
        onClose={closePasswordModalHandler}
      />
    </div>
  );
}

export default CreateUser;
