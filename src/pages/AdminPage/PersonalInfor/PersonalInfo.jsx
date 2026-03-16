import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../presentation/hooks/useAuth";
import { useUser } from "../../../presentation/hooks/useUser";
import { useToast } from "../../../hooks/useToast";
import { translateErrorMessage } from "../../../utils/errorHandler";
import { getLoginRedirectUrl, resolveWorkdayAssetUrl, resolveAbsoluteWorkdayAssetUrl } from "../../../config/constants";
import AvatarUploadModal from "../Topbar/AvatarUploadModal";
import { FaUser, FaCamera, FaRegCalendarAlt } from "react-icons/fa";
import "./PersonalInfo.css";

function PersonalInfo({ onAvatarChange, onProfileUpdate }) {
  const [id, setId] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfBirthInput, setDateOfBirthInput] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [showEditMode, setShowEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [originalValues, setOriginalValues] = useState({});
  const hiddenDatePickerRef = useRef(null);

  const { getCurrentUser } = useAuth();
  const { profile, loading, loadProfile, loadProfileMe, updateProfileMe, updateUser } = useUser();
  const { showToast } = useToast();

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length <= 3) return phoneStr;
    const firstThree = phoneStr.substring(0, 3);
    const rest = '*'.repeat(phoneStr.length - 3);
    return firstThree + rest;
  };

  const convertGenderFromAPI = (genderAPI) => {
    return genderAPI || '';
  };

  const formatDateFromAPI = (dateValue) => {
    if (!dateValue) return '';
    
    const value = dateValue.toString().trim();
    
    // Trường hợp format: YYYY-MM-DDTHH:mm:ss
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }
    
    // Trường hợp format lộn xộn như: 30T00:00:00/01/2026 - extract dd/mm/yyyy
    const mixedMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mixedMatch) {
      const [, day, month, year] = mixedMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Trường hợp format: dd/mm/yyyy
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    // Nếu đã là YYYY-MM-DD, return as-is
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }
    
    return '';
  };

  const formatDateForDisplay = (dateValue) => {
    if (!dateValue) return '';
    
    // Convert từ YYYY-MM-DD sang dd/mm/yyyy
    const parts = dateValue.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    return dateValue;
  };

  const formatDateForAPI = (dateValue) => {
    if (!dateValue) return null;
    // Nếu là YYYY-MM-DD, convert sang YYYY-MM-DDTHH:mm:ss
    if (dateValue && dateValue.length === 10) {
      return dateValue + 'T00:00:00';
    }
    return dateValue;
  };

  const isValidDateInput = (dateInputValue) => {
    const match = dateInputValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const parsed = new Date(year, month - 1, day);

    return (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    );
  };

  const normalizeDateInput = (rawValue) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    if (digits.length <= 2) return day;
    if (digits.length <= 4) return `${day}/${month}`;
    return `${day}/${month}/${year}`;
  };

  const handleCalendarButtonClick = () => {
    if (!hiddenDatePickerRef.current) return;

    if (typeof hiddenDatePickerRef.current.showPicker === 'function') {
      hiddenDatePickerRef.current.showPicker();
      return;
    }

    hiddenDatePickerRef.current.focus();
    hiddenDatePickerRef.current.click();
  };

  const handleCalendarDateChange = (value) => {
    setDateOfBirth(value || '');
    setDateOfBirthInput(formatDateForInput(value || ''));
  };

  // Convert from DD/MM/YYYY (input format) to YYYY-MM-DD (internal format)
  const formatDateInputToDB = (dateInputValue) => {
    if (!dateInputValue) return '';
    const parts = dateInputValue.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateInputValue;
  };

  // Convert from YYYY-MM-DD to DD/MM/YYYY for display in edit mode
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    const parts = dateValue.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateValue;
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      if (showEditMode && dateOfBirthInput && !isValidDateInput(dateOfBirthInput)) {
        showToast('Ngày sinh không hợp lệ. Vui lòng nhập theo dạng dd/mm/yyyy', 'warning');
        return;
      }
      
      // Lấy user ID từ token
      const user = getCurrentUser();
      if (!user) {
     
        // Token invalid/expired - redirect ngay, toast hiện sau
        sessionStorage.setItem('auth-expired-toast', '1');
        localStorage.clear();
        window.location.href = getLoginRedirectUrl();
        return;
      }

      // Cập nhật thông tin user cơ bản via /api/user/{id}
    

      // Cập nhật thông tin hồ sơ khác via /api/userProfile/me
      await updateProfileMe({
        id : user.id,
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber || null,
        avatarUrl: avatarUrl ? resolveAbsoluteWorkdayAssetUrl(avatarUrl) : null,
        gender: gender || null,
        dateOfBirth: formatDateForAPI(dateOfBirth)
      });

      // Update avatar in parent component (Main.jsx) if changed
      if (onAvatarChange && avatarUrl) {
        onAvatarChange(avatarUrl);
      }

      setShowEditMode(false);
      showToast('Cập nhật thông tin thành công!', 'success');
      
      // Trigger profile reload in Main.jsx to update fullName and other fields in Topbar
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      showToast(translateErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {  
    // Restore original values
    
    setFullName(originalValues.fullName || "");
    setEmail(originalValues.email || "");
    setDateOfBirth(originalValues.dateOfBirth || "");
    setDateOfBirthInput(formatDateForInput(originalValues.dateOfBirth || ""));
    setGender(originalValues.gender || "");
    setPhoneNumber(originalValues.phoneNumber || "");
    
    // Exit edit mode
    setShowEditMode(false);
  };

  const handleAvatarUpload = async (newAvatarUrl) => {
    // Update local state with new avatar URL
    setAvatarUrl(newAvatarUrl);
    setShowAvatarModal(false);
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
       
        const user = getCurrentUser();
        if (!user) {
     
          // Token invalid/expired - redirect ngay, toast hiện sau
          sessionStorage.setItem('auth-expired-toast', '1');
          localStorage.clear();
          window.location.href = getLoginRedirectUrl();
          return;
        }

        // Load basic user info (/user/{id})
        const data = await loadProfile();
        setUserName(user?.username || "");
        // Load personal profile info (/userProfile/me)
        const profileMeData = await loadProfileMe();
        const dobValue = formatDateFromAPI(profileMeData.dateOfBirth || profileMeData.birthDate || profileMeData.dob || "");
       
        setId(profileMeData.id || "");
        setAvatarUrl(profileMeData.avatarUrl || null);
        setFullName(profileMeData.fullName || "");
        setEmail(profileMeData.email || "");
        setDateOfBirth(dobValue);
        setDateOfBirthInput(formatDateForInput(dobValue));
        setGender(convertGenderFromAPI(profileMeData.gender || ""));
        setPhoneNumber(profileMeData.phoneNumber || "");
        
        // Lưu original values cho việc cancel edit
        setOriginalValues({
          fullName: profileMeData.fullName || "",
          email: profileMeData.email || "",
          dateOfBirth: dobValue,
          gender: convertGenderFromAPI(profileMeData.gender || ""),
          phoneNumber: profileMeData.phoneNumber || "",
        });
      } catch (error) {
     
        showToast('Lỗi tải thông tin cá nhân: ' + error.message, 'error', 2000);
        // Nếu lỗi liên quan đến token, redirect ngay (toast sẽ hiện sau)
        if (error.message && (error.message.includes('token') || error.message.includes('unauthorized') || error.message.includes('redirecting'))) {
          sessionStorage.setItem('auth-expired-toast', '1');
          localStorage.clear();
          window.location.href = getLoginRedirectUrl();
        }
      }
    };

    loadUserProfile();
  }, []);

  return (
    <div className="personal-info-container">
      <div className="personal-info-header">
        <h2 className="personal-info-title">Thông tin cá nhân</h2>
        {showEditMode ? (
          <div className="header-profile-buttons">
            <button
              className="cancel-profile-button"
              onClick={handleCancel}
              disabled={saving}
              title="Hủy chỉnh sửa"
            >
              Hủy
            </button>
            <button
              className="save-profile-button"
              onClick={handleSaveProfile}
              disabled={saving}
              title="Lưu thông tin"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        ) : (
          <button
            className="edit-page-button"
            onClick={() => {
              // Store original values before entering edit mode
              setOriginalValues({
                avatarUrl,
                fullName,
                email,
                dateOfBirth,
                gender,
                phoneNumber
              });
              setDateOfBirthInput(formatDateForInput(dateOfBirth));
              setShowEditMode(true);
            }}
            title="Chỉnh sửa trang cá nhân"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-display">
          {avatarUrl ? (
            <img src={resolveWorkdayAssetUrl(avatarUrl)} alt="Avatar" className="avatar-image" />
          ) : (
            <div className="avatar-placeholder">
              <FaUser />
            </div>
          )}
          {showEditMode && (
            <button 
              className="avatar-change-button"
              onClick={() => setShowAvatarModal(true)}
              title="Thay đổi ảnh đại diện"
            >
              <FaCamera />
            </button>
          )}
        </div>
        <div className="avatar-info">
          <div className="avatar-header">
            {showEditMode ? (
              <div className="form-group">
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input avatar-name-input"
                  placeholder="Tên đầy đủ"
                />
              </div>
            ) : (
              <h3 className="avatar-name-display">{fullName || 'Người dùng'}</h3>
            )}
          </div>
          <div className="form-group">
            {showEditMode ? (
              <>
              
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="Forexample@email.com"
                  />
                </div>
              </>
            ) : (
              <div className="email-display">
              
                <span className="email-value">{email || 'Chưa cập nhật'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dateOfBirth">Ngày sinh</label>
          <div className="input-wrapper">
            {showEditMode ? (
              <div className="input-wrapper">
                <input
                  type="text"
                  id="dateOfBirth"
                  value={dateOfBirthInput}
                  onChange={(e) => {
                    const normalized = normalizeDateInput(e.target.value);
                    setDateOfBirthInput(normalized);

                    if (normalized.length === 10 && isValidDateInput(normalized)) {
                      setDateOfBirth(formatDateInputToDB(normalized));
                    } else if (!normalized) {
                      setDateOfBirth('');
                    }
                  }}
                  className="form-input"
                  placeholder="dd/mm/yyyy"
                  maxLength={10}
                />
                <button
                  type="button"
                  className="input-icon-button"
                  onClick={handleCalendarButtonClick}
                  title="Chọn ngày từ lịch"
                  aria-label="Chọn ngày sinh từ lịch"
                >
                  <FaRegCalendarAlt />
                </button>
                <input
                  ref={hiddenDatePickerRef}
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => handleCalendarDateChange(e.target.value)}
                  className="hidden-date-picker-input"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>
            ) : (
              <input
                type="text"
                id="dateOfBirth"
                value={formatDateForDisplay(dateOfBirth)}
                className="form-input"
                readOnly
              />
            )}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="gender">Giới tính</label>
          <div className="input-wrapper">
            {showEditMode ? (
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="form-input"
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            ) : (
              <input
                type="text"
                id="gender"
                value={gender}
                className="form-input"
                readOnly
              />
            )}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phoneNumber">Số điện thoại</label>
          <div className="input-wrapper">
            <input
              type={showEditMode ? "tel" : "text"}
              id="phoneNumber"
              value={showEditMode ? phoneNumber : formatPhoneNumber(phoneNumber)}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="form-input"
              placeholder={showEditMode ? "Nhập số điện thoại" : ""}
              readOnly={!showEditMode}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="userId">ID</label>
          <div className="input-wrapper">
            <input
              type="text"
              id="userId"
              value={id}
              className="form-input form-input--readonly"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal */}
      <AvatarUploadModal 
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onUpload={handleAvatarUpload}
        currentAvatar={resolveWorkdayAssetUrl(avatarUrl)}
      />
    </div>
  );
}

export default PersonalInfo;

