import { useState, useEffect } from "react";
import { userAPI } from "../../../services/api";
import './ManageProfile.css';

function ManageProfile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("Nam");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await userAPI.getProfile();
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setBirthDate(data.birthDate || "");
      setGender(data.gender || "Nam");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setUserName(data.userName || "");
    } catch (error) {
      console.error("Error loading profile:", error);
      // Sử dụng dữ liệu mặc định nếu API lỗi
      setFirstName("Hưng");
      setLastName("Phạm");
      setBirthDate("2003-09-13");
      setGender("Nam");
      setEmail("hungpham@gmail.com");
      setPhone("1234567890");
      setAddress("123 Main St");
      setUserName("hung.pq");
    } finally {
      setLoading(false);
    }
  };

  const [openModal, setOpenModal] = useState(false);
  const openModalHandler = () => {
    setOpenModal(true);
  };
  const closeModalHandler = () => {
    setOpenModal(false);
  };
  const saveChangesHandler = async () => {
    setLoading(true);
    try {
      const profileData = {
        firstName,
        lastName,
        birthDate,
        gender,
        email,
        phone,
        address,
        userName,
      };
      
      await userAPI.updateProfile(profileData);
      alert("Cập nhật thông tin thành công!");
      closeModalHandler();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
  function Modal() {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2 className="modal-header">
            Xác nhận cập nhật thông tin người dùng?
          </h2>
          <div className="modal-buttons">
            <button
              className="cancel-button"
              onClick={closeModalHandler}
            >
              Hủy
            </button>
            <button
              className="confirm-button"
              onClick={saveChangesHandler}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    );
  }

  const firstNameChange = (e) => {
    setFirstName(e.target.value);
    console.log("First Name: ", e.target.value);
  };
  const lastNameChange = (e) => {
    setLastName(e.target.value);
  };
  const birthDateChange = (e) => {
    setBirthDate(e.target.value);
  };
  const genderChange = (e) => {
    setGender(e.target.value);
  };
  const emailChange = (e) => {
    setEmail(e.target.value);
  };
  const phoneChange = (e) => {
    setPhone(e.target.value);
  };
  const addressChange = (e) => {
    setAddress(e.target.value);
  };
  const userNameChange = (e) => {
    setUserName(e.target.value);
  };

  return (
    <div className="manage-profile-container">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">Tên</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={firstNameChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Họ</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={lastNameChange}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="birthDate">Ngày sinh</label>
          <input
            type="date"
            id="birthDate"
            value={birthDate}
            onChange={birthDateChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="gender">Giới tính</label>
          <select
            value={gender}
            id="gender"
            onChange={genderChange}
            className="form-select"
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
      </div>

      <div className="form-row">
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
          <label htmlFor="phone">Số điện thoại</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={phoneChange}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="address">Địa chỉ</label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={addressChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
        <label htmlFor="userName">Tên đăng nhập</label>
        <input
          id="userName"
          value={userName}
          onChange={userNameChange}
          className="form-input"
        />
     

    
      
      </div>

      
   

     
      </div>

      <div className="button-container">
        <button
          className="save-button"
          onClick={openModalHandler}
        >
          Lưu
        </button>
      </div>
      {openModal && <Modal />}
    </div>
  );
}

export default ManageProfile;
