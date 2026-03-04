import { useState, useEffect, useMemo, memo } from "react";
import "./WorkDayTable.css";
import { usePayroll } from "../../../presentation/hooks/usePayroll";
import { useAuth } from "../../../presentation/hooks/useAuth";
import { useUser } from "../../../presentation/hooks/useUser";
import { userAPI, payrollAPI } from "../../../services/api";
import { USER_ROLES } from "../../../config/constants";
import { 
  getUserRole,
  isAdmin,
  isHR,
  hasPermission,
} from "../../../config/PermissionHelper";
import { PERMISSIONS } from "../../../config/constants";

function WorkDayTable() {
  // Initialize with current month
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNum);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeSalaries, setEmployeeSalaries] = useState({});
  const [loadingSalaries, setLoadingSalaries] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [timesheetData, setTimesheetData] = useState([]);
  const [loadingTimesheet, setLoadingTimesheet] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { formatCurrency } = usePayroll();

  const { getCurrentUser } = useAuth();
  const { loadProfile } = useUser();

  // Helper function to check if user is employee (only has read permission, no write)
  const isEmployeeRole = () => {
    return !hasPermission(PERMISSIONS.HR_TIMEKEEPING_WRITE);
  };

  // Helper function to check if user is HR or Admin (has write permission)
  const isHROrAdmin = () => {
    return hasPermission(PERMISSIONS.HR_TIMEKEEPING_WRITE) || hasPermission(PERMISSIONS.SYSTEM_USERS_WRITE);
  };

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
    (_, i) => startYear + i,
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

  // Get current user and load profile on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = getCurrentUser();
        setCurrentUser(user);

        if (user) {
          const profile = await loadProfile();
          setUserProfile(profile);
        }
      } catch (error) {
        // Error loading user data
      }
    };

    loadUserData();
  }, []);

  // Fetch all employees (only on component mount and only for admin)
  useEffect(() => {
    const loadAllEmployees = async () => {
      try {
        let employeeList = [];

        if (isEmployeeRole()) {
          // Employee: only fetch their own data
          if (currentUser) {
            employeeList = [
              {
                id: currentUser.id,
                fullName:
                  userProfile?.fullName ||
                  currentUser?.fullName ||
                  "Chưa cập nhật",
                days: Array.from({ length: daysInMonth }, () => ""),
                total: 26,
                overtimeHours: 0,
                unpaidLeave: 1,
                holidayLeave: 1,
                paidLeave: 0,
              },
            ];
          }
        } else {
          // Admin/HR: fetch all employees
          employeeList = await userAPI.getAllUsers();
        }

        const formattedEmployees = employeeList.map((emp) => ({
          id: emp.id,
          fullName: emp.fullName || "Chưa cập nhật",
          days: Array.from({ length: daysInMonth }, () => ""),
          total: 26,
          overtimeHours: 0,
          unpaidLeave: 1,
          holidayLeave: 1,
          paidLeave: 0,
        }));
        setEmployees(formattedEmployees);
      } catch (error) {
        // Error fetching employees
      }
    };

    loadAllEmployees();
  }, [userProfile]);

  // Helper function to fetch salaries
  const fetchSalariesForMonth = async (month, year, empList = null) => {
    const employeeList = empList || employees;
    // Check if user is employee
    if (isEmployeeRole()) {
      // Employee: fetch only their own salary
      if (!currentUser) return;

      try {
        setLoadingSalaries(true);

        const response = await payrollAPI.calculateSinglePayroll(
          currentUser.id,
          month,
          year,
        );

        const salariesMap = {};

        // Handle both single object and array response
        const salaryData = Array.isArray(response) ? response[0] : response;
        if (salaryData) {
          salariesMap[currentUser.id] = {
            baseSalary: salaryData.salaryBaseAmount || 0,
            totalAllowances: salaryData.totalAllowances || 0,
            totalAmount: salaryData.grandTotalSalary || 0,
            advancePayment: salaryData.totalAdvance || 0,
            remainingAmount: salaryData.netPay || 0,
            totalWorkDays: salaryData.totalWorkDays || 0,
            totalOvertimeHours: salaryData.totalOvertimeHours || 0,
          };
        }

        setEmployeeSalaries(salariesMap);
      } catch (error) {
        // Error fetching salary
      } finally {
        setLoadingSalaries(false);
      }
    } else {
      // Admin: fetch all employees' salaries
      try {
        setLoadingSalaries(true);

        const response = await payrollAPI.calculatePayroll(month, year);

        const salariesMap = {};

        if (Array.isArray(response)) {
          response.forEach((salary) => {
            salariesMap[salary.id] = {
              baseSalary: salary.salaryBaseAmount || 0,
              totalAllowances: salary.totalAllowances || 0,
              totalAmount: salary.grandTotalSalary || 0,
              advancePayment: salary.totalAdvance || 0,
              remainingAmount: salary.netPay || 0,
              totalWorkDays: salary.totalWorkDays || 0,
              totalOvertimeHours: salary.totalOvertimeHours || 0,
            };
          });
        }

        setEmployeeSalaries(salariesMap);
      } catch (error) {
        // Error fetching all salaries
      } finally {
        setLoadingSalaries(false);
      }
    }
  };

  // Fetch salaries when employees list changes (initial load)
  // Removed: Data only fetches when user clicks "Tra cứu" button

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
    setEmployeeSalaries({});
    setHasSearched(false);

    // If selected year is current year, ensure month is not in future
    if (newYear === currentYear && selectedMonth > currentMonthNum) {
      setSelectedMonth(currentMonthNum);
    }
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
    setEmployeeSalaries({});
    setHasSearched(false);
  };

  const handleSearch = async () => {
    setHasSearched(true);
    // Only admin/HR needs to refresh employees list
    if (!isEmployeeRole()) {
      try {
        const employeeList = await userAPI.getAllUsers();
        const formattedEmployees = employeeList.map((emp) => ({
          id: emp.id,
          fullName: emp.fullName || "Chưa cập nhật",
          days: Array.from({ length: daysInMonth }, () => ""),
          total: 26,
          overtimeHours: 0,
          unpaidLeave: 1,
          holidayLeave: 1,
          paidLeave: 0,
        }));
        setEmployees(formattedEmployees);
      } catch (error) {
        // Error fetching employees
      }
    }
    // Fetch salaries with updated employees
    await fetchSalariesForMonth(selectedMonth, selectedYear);
  };

  // Check if a month should be disabled
  const isMonthDisabled = (monthValue) => {
    return selectedYear === currentYear && monthValue > currentMonthNum;
  };

  const handleViewDetails = async (row) => {
    setSelectedRow(row);
    setShowDetailModal(true);
    setLoadingTimesheet(true);
    try {
      const data = await payrollAPI.getTimesheetData(
        row.id,
        selectedMonth,
        selectedYear,
      );
      setTimesheetData(Array.isArray(data) ? data : []);
    } catch (error) {
      setTimesheetData([]);
    } finally {
      setLoadingTimesheet(false);
    }
  };

  // Memoized table header - doesn't change, so it won't re-render
  const tableHeader = useMemo(
    () => (
      <div className="div-header">
        <div className="header-cell col-action">Hành động</div>
        <div className="header-cell col-index">TT</div>
        <div className="header-cell col-name">Tên</div>
        <div className="header-cell col-total">Tổng công</div>
        <div className="header-cell col-overtime">Tổng tăng ca</div>
        <div className="header-cell col-salary">Lương</div>
        <div className="header-cell col-allowance">Phụ cấp</div>
        <div className="header-cell col-total-salary">Tổng</div>
        <div className="header-cell col-advance">Trừ Tạm Ứng</div>
        <div className="header-cell col-remaining">Còn lại</div>
      </div>
    ),
    [],
  );

  const rows = employees.filter(
    (emp) =>
      employeeSalaries[emp.id] && employeeSalaries[emp.id].totalAmount > 0,
  );

  return (
    <div className="page-container">
      <h2>Bảng chấm công và lương tháng {monthLabel}</h2>
      <div className="div flex-contain-workday">
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
        <button
          onClick={handleSearch}
          style={{
            height: "40px",
            padding: "8px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            marginRight: "30px",
            transition: "background-color 0.3s",

          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#2563eb")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#3b82f6")}
        >
          Tra cứu
        </button>
      </div>
      {loadingSalaries && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #e5e7eb",
                borderTop: "4px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p
              style={{
                color: "white",
                fontSize: "16px",
                fontWeight: "500",
                margin: 0,
              }}
            >
              Đang tải dữ liệu lương...
            </p>
            <style>{`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        </div>
      )}

      {employees && employees.length === 0 ? (
        <div className="table-wrapper">
          <div className="div-table">
            {tableHeader}
            <div
              className="empty-body"
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "16px",
                fontWeight: "500",
                display: "grid",
                gridColumn: "1 / -1",
              }}
            >
              {!hasSearched ? (
                <span>
                  Vui lòng nhấp nút{" "}
                  <a>
                    <b>Tra cứu</b>
                  </a>{" "}
                  để xem dữ liệu
                </span>
              ) : (
                "Chưa có dữ liệu lương trong tháng " +
                selectedMonth +
                " năm " +
                selectedYear
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="div-table">
            {tableHeader}
            <div className="div-body">
              {rows.length === 0 ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#6b7280",
                    fontSize: "16px",
                    fontWeight: "500",
                    display: "grid",
                    gridColumn: "1 / -1",
                  }}
                >
                  {!hasSearched ? (
                    <span>
                      Vui lòng nhấp nút{" "}
                      <a>
                        <b>Tra cứu</b>
                      </a>{" "}
                      để xem dữ liệu
                    </span>
                  ) : (
                    "Chưa có dữ liệu"
                  )}
                </div>
              ) : (
                rows.map((row, index) => (
                  <div key={row.id} className="div-row">
                    <div className="data-cell col-action">
                      <button
                        onClick={() => handleViewDetails(row)}
                        className="detail-btn"
                        disabled={
                          isEmployeeRole() && row.id !== currentUser?.id
                        }
                        style={
                          isEmployeeRole() && row.id !== currentUser?.id
                            ? { opacity: 0.5, cursor: "not-allowed" }
                            : {}
                        }
                        title={
                          isEmployeeRole() && row.id !== currentUser?.id
                            ? "Chỉ có thể xem dữ liệu của chính mình"
                            : "Xem chi tiết"
                        }
                      >
                        Chi tiết
                      </button>
                    </div>
                    <div className="data-cell col-index">{index + 1}</div>
                    <div className="data-cell col-name cell-left">
                      {row.fullName}
                    </div>
                    <div className="data-cell col-total">
                      {employeeSalaries[row.id] &&
                      employeeSalaries[row.id].totalWorkDays !== undefined
                        ? employeeSalaries[row.id].totalWorkDays
                        : "—"}
                    </div>
                    <div className="data-cell col-overtime">
                      {employeeSalaries[row.id] &&
                      employeeSalaries[row.id].totalOvertimeHours !== undefined
                        ? employeeSalaries[row.id].totalOvertimeHours
                        : "—"}
                    </div>
                    <div className="data-cell col-salary">
                      {employeeSalaries[row.id] &&
                      employeeSalaries[row.id].baseSalary !== undefined
                        ? formatCurrency(employeeSalaries[row.id].baseSalary)
                        : "—"}
                    </div>
                    <div className="data-cell col-allowance">
                      {employeeSalaries[row.id] &&
                      employeeSalaries[row.id].totalAllowances !== undefined
                        ? formatCurrency(
                            employeeSalaries[row.id].totalAllowances,
                          )
                        : "—"}
                    </div>
                    <div className="data-cell col-total-salary">
                      {employeeSalaries[row.id] &&
                      employeeSalaries[row.id].totalAmount !== undefined
                        ? formatCurrency(employeeSalaries[row.id].totalAmount)
                        : "—"}
                    </div>
                    <div className="data-cell col-advance">
                      {employeeSalaries[row.id] &&
                      employeeSalaries[row.id].advancePayment !== undefined
                        ? formatCurrency(
                            employeeSalaries[row.id].advancePayment,
                          )
                        : "—"}
                    </div>
                    <div className="data-cell col-remaining">
                      {employeeSalaries[row.id] &&
                      employeeSalaries[row.id].remainingAmount !== undefined
                        ? formatCurrency(
                            employeeSalaries[row.id].remainingAmount,
                          )
                        : "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedRow && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "30px",
              maxWidth: "1200px",
              width: "95%",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px" }}>
              Chi tiết chấm công -{" "}
              {employees.find((e) => e.id === selectedRow.id)?.fullName ||
                selectedRow.fullName}{" "}
              - {monthLabel}
            </h3>

            {loadingTimesheet ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "40px",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #e5e7eb",
                    borderTop: "4px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p style={{ color: "#6b7280", margin: 0 }}>
                  Đang tải dữ liệu...
                </p>
              </div>
            ) : timesheetData.length > 0 ? (
              <div
                style={{
                  overflowX: "auto",
                  marginBottom: "20px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f3f4f6",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#374151",
                          borderRight: "1px solid #e5e7eb",
                        }}
                      >
                        Ngày công
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#374151",
                          borderRight: "1px solid #e5e7eb",
                        }}
                      >
                        Công chuẩn
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontWeight: "600",
                          color: "#374151",
                          borderRight: "1px solid #e5e7eb",
                        }}
                      >
                        Tăng ca (giờ)
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {timesheetData.map((item, index) => {
                      const workDate = new Date(item.workDate);
                      const dateStr = workDate.toLocaleDateString("vi-VN", {
                        weekday: "short",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      });
                      return (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid #e5e7eb",
                            backgroundColor:
                              index % 2 === 0 ? "#ffffff" : "#f9fafb",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px",
                              borderRight: "1px solid #e5e7eb",
                            }}
                          >
                            {dateStr}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              borderRight: "1px solid #e5e7eb",
                              fontWeight: "500",
                            }}
                          >
                            {item.standardWorkDays}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              borderRight: "1px solid #e5e7eb",
                              fontWeight: "500",
                              color:
                                item.overtimeHours > 0 ? "#dc2626" : "#6b7280",
                            }}
                          >
                            {item.overtimeHours > 0 ? item.overtimeHours : "—"}
                          </td>
                          <td
                            style={{
                              padding: "12px",
                              color: "#6b7280",
                            }}
                          >
                            {item.note ? (
                              <span
                                style={{
                                  backgroundColor: "#fef3c7",
                                  color: "#92400e",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                {item.note}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: "16px",
                }}
              >
                Không có dữ liệu chấm công
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#e5e7eb",
                  color: "#1f2937",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkDayTable;
