import { useState, useEffect, useRef } from "react";
import { useUser } from "../../../presentation/hooks/useUser";
import { getUserFromToken } from "../../../config/TokenHelper";
import { useToast } from "../../../hooks/useToast";
import { userAPI } from "../../../services/api";
import "./ManageProfile.css";
import PasswordResultModal from "./PasswordResultModal";

function ManageProfile() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const username = useRef(null);
  
  const { showToast } = useToast();

  const handleCreateUser = async () => {
    if (!fullName || !userName) {
      showToast("Vui lòng nhập đầy đủ thông tin.", "warning");
      return;
    }
     try {
    const userData = {
      fullName,
      userName,
    };
    if (email) {
      userData.email = email;
    }
     const response = await userAPI.createUser(userData);
      const password = response.generatedPassword;
      
      setGeneratedPassword(password);
      setOpenModal(false);
      setShowPasswordModal(true);
      
      // Reset form
      setFullName("");
      setEmail("");
      setUserName("");
    // Chỉ thêm email nếu người dùng nhập
    

    
     
    } catch (error) {
      const errorMessage =
        error.detail ||
        error.message ||
        "Tạo tài khoản thất bại. Vui lòng thử lại.";
      showToast(errorMessage, "error");
    }
  };

  const openModalHandler = () => {
    setOpenModal(true);
  };

  const closeModalHandler = () => {
    setOpenModal(false);
  };

  const closePasswordModalHandler = () => {
    setShowPasswordModal(false);
  };

  function Modal() {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2 className="modal-header">Xác nhận tạo tài khoản mới?</h2>
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
    setUserName(e.target.value);
  };

  return (
    <div className="manage-profile-container">
      <div className="form-row top-form-row">
        <h2 className="personal-info-title">Cấp tài khoản mới</h2>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="fullName">Tên</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={fullNameChange}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={emailChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="userName">Tên đăng nhập</label>
          <input
            ref={username}
            id="userName"
            value={userName}
            onChange={userNameChange}
            className="form-input"
          />
        </div>
      </div>
      <div className="button-container" style={{ marginLeft: "0.5rem" }}>
        <button className="create-button" onClick={openModalHandler}>
          Tạo tài khoản
        </button>
      </div>
      {openModal && <Modal />}
      <PasswordResultModal 
        isOpen={showPasswordModal} 
        password={generatedPassword} 
        username={username.current?.value}
        onClose={closePasswordModalHandler}
      />
    </div>
  );
}

export default ManageProfile;


