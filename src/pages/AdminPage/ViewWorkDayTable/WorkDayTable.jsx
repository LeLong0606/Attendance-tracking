import { useState } from "react";
import "./WorkDayTable.css";

function WorkDayTable() {
  // Initialize with current month
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1; // 1-12
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  
  // Create date from selected year and month
  const selectedDate = new Date(selectedYear, selectedMonth - 1);
  
  const monthLabel = selectedDate.toLocaleString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  // Calculate actual days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  
  // Generate year options (from 2020 to current year)
  const startYear = 2020;
  const years = Array.from(
    { length: currentYear - startYear + 1 }, 
    (_, i) => startYear + i
  );
  
  // Months array
  const months = [
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
  ];
  
  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
    
    // If selected year is current year, ensure month is not in future
    if (newYear === currentYear && selectedMonth > currentMonthNum) {
      setSelectedMonth(currentMonthNum);
    }
  };
  
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };
  
  // Check if a month should be disabled
  const isMonthDisabled = (monthValue) => {
    return selectedYear === currentYear && monthValue > currentMonthNum;
  };

  const rows = [
    {
      id: 1,
      fullName: "Nguyen Van A",
      role: "Nhan vien",
      days: Array.from({ length: daysInMonth }, () => ""),
      total: 26,
      unpaidLeave: 1,
      holidayLeave: 1,
      paidLeave: 0,
    },
    {
      id: 2,
      fullName: "Tran Thi B",
      role: "To truong",
      days: Array.from({ length: daysInMonth }, () => ""),
      total: 24,
      unpaidLeave: 0,
      holidayLeave: 1,
      paidLeave: 1,
    },
  ];

  return (
    <div className="page-container">
      <h2>Bảng chấm công tháng {monthLabel}</h2>
      <div className="month-selector">
        <div className="selector-group">
          <label htmlFor="yearPicker">Năm: </label>
          <select
            id="yearPicker"
            value={selectedYear}
            onChange={handleYearChange}
            className="year-picker"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        
        <div className="selector-group">
          <label htmlFor="monthPicker">Tháng: </label>
          <select
            id="monthPicker"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="month-picker-dropdown"
          >
            {months.map((month) => (
              <option 
                key={month.value} 
                value={month.value}
                disabled={isMonthDisabled(month.value)}
              >
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="workday-table">
          <thead>
            <tr>
              <th rowSpan="2" className="col-index">
                TT
              </th>
              <th rowSpan="2" className="col-name">
                Họ và tên
              </th>
              <th rowSpan="2" className="col-role">
               Chức vụ
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
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td className="cell-left">{row.fullName}</td>
                <td>{row.role}</td>
                {row.days.map((value, index) => (
                  <td key={`${row.id}-${index}`} className="day-cell">
                    {value}
                  </td>
                ))}
                <td>{row.total}</td>
                <td>{row.unpaidLeave}</td>
                <td>{row.holidayLeave}</td>
                <td>{row.paidLeave}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkDayTable;
