import { useState, useEffect } from "react";
import { useAuth } from "../../../presentation/hooks/useAuth";
import { useUser } from "../../../presentation/hooks/useUser";
import { useToast } from "../../../hooks/useToast";
import { EditIcon, CheckIcon } from "../../../utils/Icons";
import "./PersonalInfo.css";

function PersonalInfo() {
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userName, setUserName] = useState("");
  const [showEditMode, setShowEditMode] = useState(false);
  const [editingFields, setEditingFields] = useState({
    fullName: false,
    email: false,
    dateOfBirth: false,
    gender: false,
    phoneNumber: false
  });
  const [saving, setSaving] = useState(false);
  const [originalValues, setOriginalValues] = useState({});

  const { getCurrentUser } = useAuth();
  const { profile, loading, loadProfile, loadProfileMe, updateProfileMe, updateUser } = useUser();
  const { showToast } = useToast();

  const toggleFieldEdit = (fieldName) => {
    setEditingFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

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

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Lấy user ID từ token
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      // Nếu có thay đổi fullName hoặc email, cập nhật via /api/user/{id}
      if (editingFields.fullName || editingFields.email) {
        await updateUser(user.id, {
          username: user.username,
          fullName: fullName,
          email: email,
          isActive: true
        });
      }

      // Cập nhật thông tin hồ sơ khác via /api/userProfile/me
      await updateProfileMe({
        phoneNumber: phoneNumber || null,
        avatarUrl: avatarUrl || null,
        gender: gender || null,
        dateOfBirth: formatDateForAPI(dateOfBirth)
      });

      setShowEditMode(false);
      setEditingFields({
        fullName: false,
        email: false,
        dateOfBirth: false,
        gender: false,
        phoneNumber: false
      });
      showToast('Cập nhật thông tin thành công!', 'success');
    } catch (error) {
      showToast('Lỗi cập nhật thông tin: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Restore original values
    setFullName(originalValues.fullName || "");
    setEmail(originalValues.email || "");
    setDateOfBirth(originalValues.dateOfBirth || "");
    setGender(originalValues.gender || "");
    setPhoneNumber(originalValues.phoneNumber || "");
    
    // Exit edit mode
    setShowEditMode(false);
    setEditingFields({
      fullName: false,
      email: false,
      dateOfBirth: false,
      gender: false,
      phoneNumber: false
    });
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
       
        const user = getCurrentUser();
        if (!user) {
          throw new Error('No user found in token');
        }

        // Load basic user info (/user/{id})
        const data = await loadProfile();
        setFullName(data.fullName || data.full_name || "");
        setEmail(user?.email || "");
        setAvatarUrl(data.avatarUrl || "");
        setUserName(user?.username || "");

        // Load personal profile info (/userProfile/me)
        const profileMeData = await loadProfileMe();
        const dobValue = formatDateFromAPI(profileMeData.dateOfBirth || profileMeData.birthDate || profileMeData.dob || "");
        setDateOfBirth(dobValue);
        setGender(convertGenderFromAPI(profileMeData.gender || ""));
        setPhoneNumber(profileMeData.phoneNumber || "");
      } catch (error) {

      }
    };

    loadUserProfile();
  }, []);

  return (
    <div className="personal-info-container">
      <div className="personal-info-header">
        <h2 className="personal-info-title">Thông tin cá nhân</h2>
        {showEditMode ? (
          <div className="header-buttons">
            <button
              className="cancel-button"
              onClick={handleCancel}
              disabled={saving}
              title="Hủy chỉnh sửa"
            >
              Hủy
            </button>
            <button
              className="save-button"
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
                fullName,
                email,
                dateOfBirth,
                gender,
                phoneNumber
              });
              setShowEditMode(true);
            }}
            title="Chỉnh sửa trang cá nhân"
          >
            <EditIcon /> Chỉnh sửa
          </button>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="fullName">Tên đầy đủ</label>
          <div className="input-wrapper">
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
              readOnly={!showEditMode || !editingFields.fullName}
            />
            {showEditMode && (
              <button
                type="button"
                className="input-icon-button"
                onClick={() => toggleFieldEdit("fullName")}
                title={editingFields.fullName ? "Lưu" : "Chỉnh sửa"}
              >
                {editingFields.fullName ? <CheckIcon /> : <EditIcon />}
              </button>
            )}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              readOnly={!showEditMode || !editingFields.email}
            />
            {showEditMode && (
              <button
                type="button"
                className="input-icon-button"
                onClick={() => toggleFieldEdit("email")}
                title={editingFields.email ? "Lưu" : "Chỉnh sửa"}
              >
                {editingFields.email ? <CheckIcon /> : <EditIcon />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dateOfBirth">Ngày sinh</label>
          <div className="input-wrapper">
            {showEditMode && editingFields.dateOfBirth ? (
              <>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="form-input"
                />
                <button
                  type="button"
                  className="input-icon-button"
                  onClick={() => toggleFieldEdit("dateOfBirth")}
                  title="Lưu"
                >
                  <CheckIcon />
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  id="dateOfBirth"
                  value={formatDateForDisplay(dateOfBirth)}
                  className="form-input"
                  readOnly
                />
                {showEditMode && (
                  <button
                    type="button"
                    className="input-icon-button"
                    onClick={() => toggleFieldEdit("dateOfBirth")}
                    title="Chỉnh sửa"
                  >
                    <EditIcon />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="gender">Giới tính</label>
          <div className="input-wrapper">
            {showEditMode && editingFields.gender ? (
              <>
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
                <button
                  type="button"
                  className="input-icon-button"
                  onClick={() => toggleFieldEdit("gender")}
                  title="Lưu"
                >
                  <CheckIcon />
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  id="gender"
                  value={gender}
                  className="form-input"
                  readOnly
                />
                {showEditMode && (
                  <button
                    type="button"
                    className="input-icon-button"
                    onClick={() => toggleFieldEdit("gender")}
                    title="Chỉnh sửa"
                  >
                    <EditIcon />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="form-row form-row--full">
        <div className="form-group">
          <label htmlFor="phoneNumber">Số điện thoại</label>
          <div className="input-wrapper">
            {showEditMode && editingFields.phoneNumber ? (
              <>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="form-input"
                />
                <button
                  type="button"
                  className="input-icon-button"
                  onClick={() => toggleFieldEdit("phoneNumber")}
                  title="Lưu"
                >
                  <CheckIcon />
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  id="phoneNumber"
                  value={formatPhoneNumber(phoneNumber)}
                  className="form-input"
                  readOnly
                />
                {showEditMode && (
                  <button
                    type="button"
                    className="input-icon-button"
                    onClick={() => toggleFieldEdit("phoneNumber")}
                    title="Chỉnh sửa"
                  >
                    <EditIcon />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalInfo;

