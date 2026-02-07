import { useState } from 'react';
import './InputWorkDay.css';

function InputWorkDay() {
  const monthLabel = new Date().toLocaleString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = 31;
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  // Sample users list - replace with API call
  const users = [
    { id: 1, name: "Nguyen Van A" },
    { id: 2, name: "Tran Thi B" },
    { id: 3, name: "Le Van C" },
  ];

  const [selectedUserId, setSelectedUserId] = useState(users[0].id);
  
  // Store work data for each user
  const [allUsersWorkData, setAllUsersWorkData] = useState({
    [users[0].id]: {
      days: Array.from({ length: daysInMonth }, () => ""),
      total: 0,
      unpaidLeave: 0,
      holidayLeave: 0,
      paidLeave: 0,
    },
  });

  // Get current user's work data
  const currentWorkData = allUsersWorkData[selectedUserId] || {
    days: Array.from({ length: daysInMonth }, () => ""),
    total: 0,
    unpaidLeave: 0,
    holidayLeave: 0,
    paidLeave: 0,
  };

  const handleUserChange = (e) => {
    const newUserId = parseInt(e.target.value);
    
    // Initialize data for new user if doesn't exist
    if (!allUsersWorkData[newUserId]) {
      setAllUsersWorkData({
        ...allUsersWorkData,
        [newUserId]: {
          days: Array.from({ length: daysInMonth }, () => ""),
          total: 0,
          unpaidLeave: 0,
          holidayLeave: 0,
          paidLeave: 0,
        },
      });
    }
    
    setSelectedUserId(newUserId);
  };

  const handleDayChange = (dayIndex, value) => {
    const newDays = [...currentWorkData.days];
    newDays[dayIndex] = value;
    
    // Calculate total based on non-empty days
    const total = newDays.filter(day => day && day !== "").length;
    
    setAllUsersWorkData({
      ...allUsersWorkData,
      [selectedUserId]: { ...currentWorkData, days: newDays, total },
    });
  };

  // Toggle day tick (X or empty)
  const handleDayClick = (dayIndex) => {
    const newDays = [...currentWorkData.days];
    // Toggle between "X" and empty
    newDays[dayIndex] = newDays[dayIndex] === "X" ? "" : "X";
    
    // Calculate total based on non-empty days
    const total = newDays.filter(day => day && day !== "").length;
    
    setAllUsersWorkData({
      ...allUsersWorkData,
      [selectedUserId]: { ...currentWorkData, days: newDays, total },
    });
  };

  const handleLeaveChange = (type, value) => {
    setAllUsersWorkData({
      ...allUsersWorkData,
      [selectedUserId]: { ...currentWorkData, [type]: value },
    });
  };

  const handleSave = async () => {
    try {
      const selectedUser = users.find(u => u.id === selectedUserId);
      console.log("Saving work days for:", selectedUser.name, currentWorkData);
      alert("Lưu dữ liệu thành công!");
      // Add API call here
    } catch (error) {
      console.error("Error saving:", error);
      alert("Lỗi khi lưu dữ liệu!");
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="page-container">
      <h2>Nhập ngày công tháng {monthLabel}</h2>
      
      <div className="user-selector">
        <label htmlFor="userSelect">Chọn người dùng: </label>
        <select 
          id="userSelect" 
          value={selectedUserId} 
          onChange={handleUserChange}
          className="user-dropdown"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="workday-table input-table">
          <thead>
            <tr>
              <th rowSpan="2" className="col-index">
                Nhân viên
              </th>
              <th colSpan={days.length} className="col-days">
                Ngày trong tháng
              </th>
              <th rowSpan="2" className="col-total">
                Tổng công
              </th>
              <th colSpan="3" className="col-leave">
                Ngày nghỉ
              </th>
            </tr>
            <tr>
              {days.map((day) => (
                <th key={day} className="day-cell">
                  {day}
                </th>
              ))}
              <th>Nghỉ không lương</th>
              <th>Nghỉ lễ</th>
              <th>Nghỉ phép</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="row-index">{selectedUser.name}</td>
              {currentWorkData.days.map((value, index) => (
                <td key={`day-${index}`} className="day-cell">
                  <div 
                    className="day-tick"
                    onClick={() => handleDayClick(index)}
                  >
                    {value}
                  </div>
                </td>
              ))}
              <td className="total-input">
                <input
                  type="number"
                  value={currentWorkData.total}
                  readOnly
                  className="leave-input"
                />
              </td>
              <td className="leave-input">
                <input
                  type="number"
                  value={currentWorkData.unpaidLeave}
                  onChange={(e) => handleLeaveChange('unpaidLeave', parseInt(e.target.value) || 0)}
                  className="leave-input"
                />
              </td>
              <td className="leave-input">
                <input
                  type="number"
                  value={currentWorkData.holidayLeave}
                  onChange={(e) => handleLeaveChange('holidayLeave', parseInt(e.target.value) || 0)}
                  className="leave-input"
                />
              </td>
              <td className="leave-input">
                <input
                  type="number"
                  value={currentWorkData.paidLeave}
                  onChange={(e) => handleLeaveChange('paidLeave', parseInt(e.target.value) || 0)}
                  className="leave-input"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="button-container">
        <button className="save-button" onClick={handleSave}>
          Lưu
        </button>
      </div>
    </div>
  );
}

export default InputWorkDay;
