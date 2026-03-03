import { useState, useEffect, useRef } from "react";
import "./InputWorkDay.css";
import { userAPI, payrollAPI } from "../../../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { useToast } from "../../../hooks/useToast";
import { translateErrorMessage } from "../../../config/constants";
import { formatDateDisplay } from "../../../utils/dateFormatter";

function InputWorkDay() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const monthLabel = new Date(selectedYear, selectedMonth - 1).toLocaleString(
    "vi-VN",
    {
      month: "long",
      year: "numeric",
    },
  );

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

  // Check if a month/year is in the future
  const isFutureDate = (year, month) => {
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  };

  // Helper function to extract day from YYYY-MM-DD format
  const getDayFromDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split('-');
    return parts[2] || "";
  };

  // Helper function to get max day for selected month/year
  const getMaxDayForMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // Helper function to construct date from day with fixed selected month/year
  const constructDateWithDay = (day) => {
    if (!day || day < 1) return "";
    const maxDay = getMaxDayForMonth(selectedMonth, selectedYear);
    const dayNum = parseInt(day);
    
    // Ensure day doesn't exceed max day for the month
    if (dayNum > maxDay) return "";
    
    const dayStr = String(dayNum).padStart(2, '0');
    const monthStr = String(selectedMonth).padStart(2, '0');
    return `${selectedYear}-${monthStr}-${dayStr}`;
  };

  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem("selectedUserIds");
    return saved ? JSON.parse(saved) : [];
  });
  const [userUpdateOrder, setUserUpdateOrder] = useState(() => {
    // Load update order from localStorage
    const saved = localStorage.getItem("userUpdateOrder");
    return saved ? JSON.parse(saved) : [];
  });
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null); // Currently editing in modal
  const [searchInput, setSearchInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedDateInModal, setSelectedDateInModal] = useState(null); // For calendar view
  const [showCalendarModal, setShowCalendarModal] = useState(false); // Calendar selection modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Custom confirmation modal
  const [confirmationAction, setConfirmationAction] = useState(null); // What to do after confirmation
  const [hasChanges, setHasChanges] = useState(false); // Flag to track if there are unsaved changes
  const searchInputRef = useRef(null);

  // Use toast notification hook
  const { showToast } = useToast();

  // Fetch users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const employeeList = await userAPI.getAllUsers();
        // Include all users, show "unknown" for missing fullName
        const filteredUsers = employeeList
          .map((emp) => ({
            id: emp.id,
            fullName:
              emp.fullName && emp.fullName.trim() !== ""
                ? emp.fullName
                : "unknown",
            username: emp.username || "",
          }))
          .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

        setUsers(filteredUsers);
      } catch (error) {
        showToast(
          "Lỗi tải danh sách nhân viên: " + (error.message || "Unknown error"),
          "error",
        );
      }
    };

    loadUsers();
  }, [showToast]);

  // Save selectedUserIds to localStorage
  useEffect(() => {
    localStorage.setItem("selectedUserIds", JSON.stringify(selectedUserIds));
  }, [selectedUserIds]);

  // Save userUpdateOrder to localStorage
  useEffect(() => {
    localStorage.setItem("userUpdateOrder", JSON.stringify(userUpdateOrder));
  }, [userUpdateOrder]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        e.target.id !== "userSearch" &&
        !e.target.closest(".dropdown-list") &&
        !e.target.closest(".note-dropdown-wrapper") &&
        !e.target.closest(".note-input-container")
      ) {
        setShowDropdown(false);
        // Close all note dropdowns
        setNoteDropdownOpen({});
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Update dropdown position when it's shown or window is resized
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
  }, [showDropdown]);

  // Reset selected date when calendar modal opens
  useEffect(() => {
    if (showCalendarModal && selectedYear && selectedMonth) {
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      setSelectedDateInModal(firstDay);
    }
  }, [showCalendarModal, selectedYear, selectedMonth]);

  // Update position on scroll
  useEffect(() => {
    if (!showDropdown) return;

    const handleScroll = () => {
      if (searchInputRef.current) {
        const rect = searchInputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left,
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showDropdown]);

  const [timesheetData, setTimesheetData] = useState(() => {
    // Load from localStorage on initial render
    try {
      const saved = localStorage.getItem("timesheetData");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Normalize: ensure all day items have 'changed' property
        const normalized = {};
        Object.keys(parsed).forEach((userId) => {
          normalized[userId] = {};
          Object.keys(parsed[userId]).forEach((dateKey) => {
            const dayData = parsed[userId][dateKey];
            normalized[userId][dateKey] = {
              standardWorkDays:
                dayData.standardWorkDays !== undefined
                  ? dayData.standardWorkDays
                  : 0,
              overtimeHours:
                dayData.overtimeHours !== undefined ? dayData.overtimeHours : 0,
              note: dayData.note || "",
              changed: dayData.changed !== undefined ? dayData.changed : false,
            };
          });
        });
        return normalized;
      }
      return {};
    } catch (error) {
      return {};
    }
  });

  // Save timesheetData to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("timesheetData", JSON.stringify(timesheetData));
    } catch (error) {}
  }, [timesheetData]);

  const [noteDropdownOpen, setNoteDropdownOpen] = useState({});
  const [noteInputMode, setNoteInputMode] = useState({});

  // Cached API data - stores fetched timesheet and salary data
  const [cachedData, setCachedData] = useState({
    timesheet: {}, // { userId: { dateKey: { standardWorkDays, overtimeHours, note } } }
    salary: {}, // { userId: { componentId: amount } }
  });

  const [salaryData, setSalaryData] = useState(() => {
    // Load from localStorage on initial render
    try {
      const saved = localStorage.getItem("salaryData");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      return {};
    }
  });

  // Normalize advance data - convert old object format to new array format
  const normalizeAdvanceData = (data) => {
    const normalized = {};
    Object.keys(data).forEach((userId) => {
      const userAdvanceData = data[userId];
      // If it's already an array, keep it
      if (Array.isArray(userAdvanceData)) {
        normalized[userId] = userAdvanceData;
      }
      // If it's an object with date/amount/note, convert to array with single entry
      else if (
        userAdvanceData &&
        typeof userAdvanceData === "object" &&
        userAdvanceData.date !== undefined
      ) {
        normalized[userId] = [userAdvanceData];
      }
      // Otherwise default to empty array
      else {
        normalized[userId] = [];
      }
    });
    return normalized;
  };

  const [advanceData, setAdvanceData] = useState(() => {
    // Load from localStorage on initial render
    try {
      const saved = localStorage.getItem("advanceData");
      const parsed = saved ? JSON.parse(saved) : {};
      // Normalize old data format to new array format
      return normalizeAdvanceData(parsed);
    } catch (error) {
      return {};
    }
  });

  // Track original advance data from API (before changes)
  const [originalAdvanceData, setOriginalAdvanceData] = useState({});

  // Track original salary data from API (before changes)
  const [originalSalaryData, setOriginalSalaryData] = useState({});

  // Track salary structure IDs from API (mapping componentId -> salaryStructureId)
  const [salaryStructureIds, setSalaryStructureIds] = useState({});

  // Save salaryData to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("salaryData", JSON.stringify(salaryData));
    } catch (error) {}
  }, [salaryData]);

  // Save advanceData to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("advanceData", JSON.stringify(advanceData));
    } catch (error) {}
  }, [advanceData]);

  // Validate advance dates when month/year changes
  useEffect(() => {
    setAdvanceData((prevData) => {
      const updatedData = { ...prevData };
      const maxDay = getMaxDayForMonth(selectedMonth, selectedYear);

      for (const userId in updatedData) {
        if (Array.isArray(updatedData[userId])) {
          updatedData[userId] = updatedData[userId].map((entry) => {
            if (entry.date) {
              const day = parseInt(getDayFromDate(entry.date));
              // If day exceeds max day for the month, clear the date
              if (day > maxDay) {
                return { ...entry, date: "" };
              }
            }
            return entry;
          });
        }
      }

      return updatedData;
    });
  }, [selectedMonth, selectedYear]);

  // Note options
  const noteOptions = [
    { value: "Tăng ca", label: "Tăng ca" },
    { value: "Tăng ca full", label: "Tăng ca full" },
    { value: "Tăng ca tối", label: "Tăng ca tối" },
    { value: "khác", label: "Khác" },
  ];

  // Salary components
  const salaryComponents = [
    { id: 1, label: "Lương ngày công", code: "DAILY_BASE" },
    { id: 2, label: "Phụ cấp nhà trọ", code: "HOUSING" },
    { id: 3, label: "Phụ cấp xăng xe", code: "PETROL" },
    { id: 4, label: "Phụ cấp điện thoại", code: "PHONE" },
  ];

  // Get current user's timesheet data for the month
  const getMonthDays = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const currentMonthDays = getMonthDays(selectedYear, selectedMonth);
  const currentTimesheetData = timesheetData[editingUserId] || {};

  // Normalize date to YYYY-MM-DD format for HTML date input
  const normalizeDateFormat = (dateStr) => {
    if (!dateStr) return "";

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // If in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month}-${day}`;
    }

    // If it's ISO format with time (2026-03-01T00:00:00), extract date part
    if (dateStr.includes("T")) {
      return dateStr.split("T")[0];
    }

    return dateStr;
  };

  // Add a new advance payment entry
  const addAdvanceEntry = () => {
    setHasChanges(true);
    setAdvanceData({
      ...advanceData,
      [editingUserId]: [
        ...(advanceData[editingUserId] || []),
        { date: "", amount: "", note: "" },
      ],
    });
  };

  // Remove an advance payment entry
  const removeAdvanceEntry = async (index) => {
    try {
      const entries = advanceData[editingUserId] || [];
      const entryToDelete = entries[index];

      // If entry has an ID, delete from API first
      if (entryToDelete && entryToDelete.id) {
        await payrollAPI.deleteAdvancePayment(entryToDelete.id);
      }

      // Update local state
      setHasChanges(true);
      const updatedEntries = entries.filter((_, i) => i !== index);
      setAdvanceData({
        ...advanceData,
        [editingUserId]: updatedEntries,
      });

      showToast('Xóa mục tạm ứng thành công!', 'success');
    } catch (error) {
      showToast('Lỗi xóa mục tạm ứng: ' + error.message, 'error');
    }
  };

  // Update an advance payment entry
  const updateAdvanceEntry = (index, field, value) => {
    setHasChanges(true);
    const entries = advanceData[editingUserId] || [];
    const updatedEntries = [...entries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      [field]: value,
    };
    setAdvanceData({
      ...advanceData,
      [editingUserId]: updatedEntries,
    });
  };

  // Fetch API data when editingUserId changes - always fetch fresh data
  useEffect(() => {
    if (!editingUserId) return;

    payrollAPI
      .getTimesheetData(editingUserId, selectedMonth, selectedYear)
      .then((apiData) => {
        let timesheetArray = [];

        // Handle different response formats
        if (Array.isArray(apiData)) {
          timesheetArray = apiData;
        } else if (
          apiData &&
          typeof apiData === "object" &&
          apiData.data &&
          Array.isArray(apiData.data)
        ) {
          timesheetArray = apiData.data;
        } else if (apiData && typeof apiData === "object") {
          timesheetArray = Object.entries(apiData).map(([date, data]) => ({
            workDate: date,
            ...data,
          }));
        }

        if (timesheetArray && timesheetArray.length > 0) {
          const timesheetMap = {};
          timesheetArray.forEach((item, index) => {
            const dateKey = item.workDate ? item.workDate.split("T")[0] : null;
            if (dateKey) {
              timesheetMap[dateKey] = {
                standardWorkDays: item.standardWorkDays || 0,
                overtimeHours: item.overtimeHours || 0,
                note: item.note || "",
              };
            }
          });

          const daysInMonth = getMonthDays(selectedYear, selectedMonth);
          const monthData = {};
          for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            monthData[dateKey] = timesheetMap[dateKey] || {
              standardWorkDays: 0,
              overtimeHours: 0,
              note: "",
              changed: false,
            };
          }

          setTimesheetData((prev) => ({
            ...prev,
            [editingUserId]: monthData,
          }));
        } else {
          const daysInMonth = getMonthDays(selectedYear, selectedMonth);
          const monthData = {};
          for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            monthData[dateKey] = {
              standardWorkDays: 0,
              overtimeHours: 0,
              note: "",
              changed: false,
            };
          }

          setTimesheetData((prev) => ({
            ...prev,
            [editingUserId]: monthData,
          }));
        }
      })
      .catch((error) => {
        // Timesheet fetch error handling
      });

    // Always fetch salary data
    payrollAPI
      .getSalaryStructure(editingUserId)
      .then((apiSalaryData) => {
        let salaryArray = [];

        // Handle different response formats
        if (Array.isArray(apiSalaryData)) {
          salaryArray = apiSalaryData;
        } else if (
          apiSalaryData &&
          typeof apiSalaryData === "object" &&
          apiSalaryData.data &&
          Array.isArray(apiSalaryData.data)
        ) {
          salaryArray = apiSalaryData.data;
        } else if (apiSalaryData && typeof apiSalaryData === "object") {
          salaryArray = Object.entries(apiSalaryData).map(([code, amount]) => ({
            componentCode: code,
            amount: amount,
          }));
        }

        if (salaryArray && salaryArray.length > 0) {
          const salaryMap = {};
          const structureIdMap = {};
          const originalSalaryMap = {};

          salaryArray.forEach((item, index) => {
            const component = salaryComponents.find(
              (c) => c.code === item.componentCode,
            );
            if (component) {
              salaryMap[component.id] = item.amount || 0;
              structureIdMap[component.id] = item.id; // Store the API salary structure ID
              originalSalaryMap[component.id] = item.amount || 0; // Store original amount
            }
          });

          setSalaryData((prev) => ({
            ...prev,
            [editingUserId]: salaryMap,
          }));

          setSalaryStructureIds((prev) => ({
            ...prev,
            [editingUserId]: structureIdMap,
          }));

          setOriginalSalaryData((prev) => ({
            ...prev,
            [editingUserId]: originalSalaryMap,
          }));
        } else {
          setSalaryData((prev) => ({
            ...prev,
            [editingUserId]: {},
          }));

          setSalaryStructureIds((prev) => ({
            ...prev,
            [editingUserId]: {},
          }));

          setOriginalSalaryData((prev) => ({
            ...prev,
            [editingUserId]: {},
          }));
        }
      })
      .catch((error) => {
        // Salary data fetch error handling
      });

    // Always fetch advance payment data
    payrollAPI
      .getAdvancePaymentData(editingUserId, selectedMonth, selectedYear)
      .then((apiAdvanceData) => {
        let advanceArray = [];

        // Handle different response formats
        if (Array.isArray(apiAdvanceData)) {
          advanceArray = apiAdvanceData;
        } else if (
          apiAdvanceData &&
          typeof apiAdvanceData === "object" &&
          apiAdvanceData.data &&
          Array.isArray(apiAdvanceData.data)
        ) {
          advanceArray = apiAdvanceData.data;
        }

        if (advanceArray && advanceArray.length > 0) {
          // Map API response fields (advanceDate, amount, note) to our format (date, amount, note)
          // Filter by selected month and year
          const mappedAdvanceData = advanceArray
            .map((item) => {
              // Extract date from ISO format "2026-03-01T00:00:00" -> "2026-03-01"
              let dateValue = "";
              if (item.advanceDate) {
                // Simple extraction: get everything before the 'T' character
                dateValue = item.advanceDate.split("T")[0];
              }
              return {
                id: item.id, // Store the advance ID for delete operations
                date: dateValue, // Store as "YYYY-MM-DD" format
                amount: item.amount || "",
                note: item.note || "",
              };
            });

          // Save original data for change detection
          setOriginalAdvanceData((prev) => ({
            ...prev,
            [editingUserId]: [...mappedAdvanceData],
          }));

          // Filter to only show entries from selected month and year
          const filteredAdvanceData = mappedAdvanceData.filter((entry) => {
            if (!entry.date) return false;
            const [year, month, day] = entry.date.split("-").map(Number);
            return year === selectedYear && month === selectedMonth;
          });

          setAdvanceData((prev) => ({
            ...prev,
            [editingUserId]: filteredAdvanceData,
          }));
        } else {
          // Initialize empty array for this user if no advance data exists
          setAdvanceData((prev) => ({
            ...prev,
            [editingUserId]: [],
          }));
        }
      })
      .catch((error) => {
        // Advance payment fetch error handling - initialize with empty array
        setAdvanceData((prev) => ({
          ...prev,
          [editingUserId]: [],
        }));
      });
  }, [editingUserId, selectedMonth, selectedYear]);

  // Handle user selection - triggers data fetch via useEffect
  const handleSelectUser = (user) => {
    // Reset changes flag when selecting a new user
    setHasChanges(false);

    // Check if user already selected
    if (selectedUserIds.includes(user.id)) {
      // Just set as editing user
      setEditingUserId(user.id);
      setShowModal(true);
      setShowDropdown(false);
      
      // Initialize original salary data from current state
      if (!originalSalaryData[user.id]) {
        setOriginalSalaryData((prev) => ({
          ...prev,
          [user.id]: { ...(salaryData[user.id] || {}) },
        }));
      }
      return;
    }

    // Add user to selected list
    const newSelectedUserIds = [...selectedUserIds, user.id];
    setSelectedUserIds(newSelectedUserIds);

    // Update user update order - move to front
    const newOrder = userUpdateOrder.filter((id) => id !== user.id);
    newOrder.unshift(user.id);
    setUserUpdateOrder(newOrder);

    // Initialize advance data for new user if not exists
    if (!advanceData[user.id]) {
      setAdvanceData((prev) => ({
        ...prev,
        [user.id]: [],
      }));
    }

    // Initialize original salary data from current state
    setOriginalSalaryData((prev) => ({
      ...prev,
      [user.id]: { ...(salaryData[user.id] || {}) },
    }));

    // Open modal for editing
    setEditingUserId(user.id);
    setShowModal(true);
    setShowDropdown(false);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    setShowDropdown(true);
  };

  const handleTimesheetChange = (dateKey, field, value) => {
    const numValue = field === "note" ? value : parseFloat(value) || 0;

    setHasChanges(true); // Đánh dấu có thay đổi
    setTimesheetData({
      ...timesheetData,
      [editingUserId]: {
        ...currentTimesheetData,
        [dateKey]: {
          ...currentTimesheetData[dateKey],
          [field]: numValue,
          changed: true,
        },
      },
    });
  };

  const handleSave = async () => {
    if (!editingUserId) {
      showToast("Vui lòng chọn nhân viên!", "error");
      return;
    }

    // Check if there's any data to save
    const currentTimesheetData = timesheetData[editingUserId] || {};
    const employeeUserData = salaryData[editingUserId] || {};
    const employeeAdvanceData = advanceData[editingUserId] || [];
    const employeeOriginalSalaryData = originalSalaryData[editingUserId] || {};

    // Check if timesheet has any changes
    const hasTimesheetChanges = Object.values(currentTimesheetData).some(
      (dayData) => dayData.changed
    );

    // Check if salary has any changes
    let hasSalaryChanges = false;
    for (const component of salaryComponents) {
      const currentAmount =
        employeeUserData[component.id] && employeeUserData[component.id] !== ""
          ? parseFloat(employeeUserData[component.id])
          : 0;
      const originalAmount =
        employeeOriginalSalaryData[component.id] !== undefined
          ? employeeOriginalSalaryData[component.id]
          : 0;

      if (currentAmount === 0 && originalAmount === 0) {
        continue;
      }

      if (currentAmount !== originalAmount) {
        hasSalaryChanges = true;
        break;
      }
    }

    // Check if advance has any changes
    let hasAdvanceChanges = false;
    const employeeOriginalAdvanceData = originalAdvanceData[editingUserId] || [];
    for (const advance of employeeAdvanceData) {
      if (advance.amount && advance.amount !== "") {
        const originalEntry = employeeOriginalAdvanceData.find(
          (orig) => orig.id === advance.id
        );
        const changed =
          !originalEntry ||
          advance.date !== originalEntry.date ||
          advance.amount !== originalEntry.amount ||
          advance.note !== originalEntry.note;

        if (changed) {
          hasAdvanceChanges = true;
          break;
        }
      }
    }

    // If no data to save, just close modal
    if (!hasTimesheetChanges && !hasSalaryChanges && !hasAdvanceChanges) {
      setShowModal(false);
      setEditingUserId(null);
      return;
    }

    try {
      const daysInMonth = getMonthDays(selectedYear, selectedMonth);
      let successCount = 0;
      let failureCount = 0;
      const errors = [];
      const timesheetItems = [];

      // Collect only changed timesheet entries from currentTimesheetData
      // Only include days where changed: true AND have actual work data
      Object.keys(currentTimesheetData).forEach((dateKey) => {
        const dayData = currentTimesheetData[dateKey];

        // Skip if not marked as changed
        if (!dayData.changed) {
          return;
        }

        // Check if date is in the future
        const [year, month, day] = dateKey.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateObj > today) {
          return; // Skip future dates
        }

        // If changed: true, post regardless of data values (including 0,0,0)
        const standardWorkDays =
          dayData.standardWorkDays !== undefined ? dayData.standardWorkDays : 0;
        const overtimeHours =
          dayData.overtimeHours !== undefined ? dayData.overtimeHours : 0;

        timesheetItems.push({
          workDate: dateKey,
          standardWorkDays: standardWorkDays,
          overtimeHours: overtimeHours,
          note: dayData.note || "",
        });
      });

      // Save all timesheet entries in bulk if there are any
      if (timesheetItems.length > 0) {
        try {
          await payrollAPI.saveTimesheetBulk(editingUserId, timesheetItems);
          successCount = timesheetItems.length;
        } catch (error) {
          failureCount = timesheetItems.length;
          const errorMsg =
            error?.message || JSON.stringify(error) || "Lỗi không xác định";
          errors.push({
            bulk: true,
            itemCount: timesheetItems.length,
            error: errorMsg,
          });
        }
      } else {
      }

      // Save salary components
      let salarySaveCount = 0;
      let salaryFailCount = 0;
      const salaryErrors = [];

      const employeeUserData = salaryData[editingUserId] || {};
      const employeeOriginalSalaryData = originalSalaryData[editingUserId] || {};
      const employeeSalaryStructureIds = salaryStructureIds[editingUserId] || {};

      for (const component of salaryComponents) {
        // Get amount or default to 0 if not provided
        const componentAmount = employeeUserData[component.id];
        const currentAmount =
          componentAmount && componentAmount !== ""
            ? parseFloat(componentAmount)
            : 0;

        const originalAmount =
          employeeOriginalSalaryData[component.id] !== undefined
            ? employeeOriginalSalaryData[component.id]
            : 0;

        // Skip if amount is 0 or empty and no original value
        if (currentAmount === 0 && originalAmount === 0) {
          continue;
        }

        // Skip if no changes
        if (currentAmount === originalAmount) {
          continue;
        }

        const salaryPayload = {
          amount: currentAmount,
        };

        try {
          // If has original value, use PUT to update
          if (originalAmount !== 0) {
            const salaryStructureId = employeeSalaryStructureIds[component.id];
            if (salaryStructureId) {
              await payrollAPI.updateSalaryComponent(salaryStructureId, salaryPayload);
            }
          }
          // If no original value, use POST to create
          else {
            const postPayload = {
              id: editingUserId,
              componentCode: component.code,
              amount: currentAmount,
            };
            await payrollAPI.saveSalaryComponent(postPayload);
          }
          salarySaveCount++;
        } catch (error) {
          salaryFailCount++;
          const errorMsg =
            error?.message || JSON.stringify(error) || "Lỗi không xác định";
          salaryErrors.push({
            component: component.label,
            payload: salaryPayload,
            error: errorMsg,
          });
        }
      }

      // Save advance payments
      let advanceSaveCount = 0;
      let advanceFailCount = 0;
      const advanceErrors = [];

      const employeeAdvanceData = advanceData[editingUserId] || [];
      const employeeOriginalAdvanceData = originalAdvanceData[editingUserId] || [];

      // Helper function to detect if an advance entry has changed
      const hasAdvanceChanged = (currentEntry, originalEntry) => {
        if (!originalEntry) return true; // New entry
        return (
          currentEntry.date !== originalEntry.date ||
          currentEntry.amount !== originalEntry.amount ||
          currentEntry.note !== originalEntry.note
        );
      };

      for (const advance of employeeAdvanceData) {
        // Only save entries that have amount (date and note can be empty)
        if (advance.amount && advance.amount !== "") {
          // Find original entry to compare
          const originalEntry = employeeOriginalAdvanceData.find(
            (orig) => orig.id === advance.id
          );

          // Check if entry has changed
          const changed = hasAdvanceChanged(advance, originalEntry);

          // Skip if no changes
          if (!changed && advance.id) {
            continue;
          }

          const advancePayload = {
            id: editingUserId,
            advanceDate: advance.date || "",
            amount: parseFloat(advance.amount),
            note: advance.note || "",
          };

          try {
            // If entry has ID and changed, use PUT to update
            if (advance.id && changed) {
              await payrollAPI.updateAdvancePayment(advance.id, advancePayload);
            }
            // If entry doesn't have ID, use POST to create
            else if (!advance.id) {
              await payrollAPI.saveAdvancePayment(advancePayload);
            }
            advanceSaveCount++;
          } catch (error) {
            advanceFailCount++;
            const errorMsg =
              error?.message || JSON.stringify(error) || "Lỗi không xác định";
            advanceErrors.push({
              payload: advancePayload,
              error: errorMsg,
            });
          }
        }
      }

      // Show combined results
      let message = "";
      const hasSuccessfulSaves =
        successCount > 0 || salarySaveCount > 0 || advanceSaveCount > 0;
      const hasFailures =
        failureCount > 0 || salaryFailCount > 0 || advanceFailCount > 0;

      if (hasSuccessfulSaves && !hasFailures) {
        // All saves successful
        message = "Cập nhật thành công";
        showToast(message, "success");
        
        // Update original advance data to match current state
        setOriginalAdvanceData((prev) => ({
          ...prev,
          [editingUserId]: [...(advanceData[editingUserId] || [])],
        }));

        // Update original salary data to match current state
        setOriginalSalaryData((prev) => ({
          ...prev,
          [editingUserId]: { ...(salaryData[editingUserId] || {}) },
        }));
        
        // Close modal after success
        setShowModal(false);
        setEditingUserId(null);
        setHasChanges(false); // Reset flag after successful save
      } else if (hasSuccessfulSaves && hasFailures) {
        // Some saves succeeded, some failed
        if (successCount > 0) {
          message += `Lưu thành công: ${successCount} dòng công`;
        }

        if (salarySaveCount > 0) {
          message += (message ? ", " : "") + `${salarySaveCount} khoản lương`;
        }

        if (advanceSaveCount > 0) {
          message +=
            (message ? ", " : "") + `${advanceSaveCount} khoản tạm ứng`;
        }

        if (failureCount > 0) {
          message += `\nLưu thất bại: ${failureCount} dòng công`;
        }

        if (salaryFailCount > 0) {
          message +=
            (failureCount > 0 ? ", " : "\nLưu thất bại: ") +
            `${salaryFailCount} khoản lương`;
        }

        if (advanceFailCount > 0) {
          message +=
            (failureCount > 0 || salaryFailCount > 0
              ? ", "
              : "\nLưu thất bại: ") + `${advanceFailCount} khoản tạm ứng`;
        }

        showToast(message, "warning");
      } else if (hasFailures) {
        // All saves failed
        if (failureCount > 0) {
          message += `Lưu thất bại: ${failureCount} dòng công`;
        }

        if (salaryFailCount > 0) {
          message +=
            (failureCount > 0 ? ", " : "") + `${salaryFailCount} khoản lương`;
        }

        if (advanceFailCount > 0) {
          message +=
            (failureCount > 0 || salaryFailCount > 0 ? ", " : "") +
            `${advanceFailCount} khoản tạm ứng`;
        }

        showToast(message, "error");
      } else {
        // No data to save
        showToast("Không có dữ liệu để lưu!", "warning");
      }

      if (failureCount > 0 || salaryFailCount > 0) {
      }
    } catch (error) {
      showToast(translateErrorMessage(error), "error");
    }
  };

  // Check if there are any unsaved changes
  const hasUnsavedChanges = () => {
    if (!editingUserId) return false;

    // Check timesheet changes
    const timesheetForUser = timesheetData[editingUserId] || {};
    for (const dateKey in timesheetForUser) {
      if (timesheetForUser[dateKey].changed === true) {
        return true;
      }
    }

    // Check salary changes (compare current values with cached)
    const currentSalary = salaryData[editingUserId] || {};
    const cachedSalary = cachedData.salary[editingUserId] || {};

    for (const componentId in currentSalary) {
      if (currentSalary[componentId] !== (cachedSalary[componentId] || 0)) {
        return true;
      }
    }

    return false;
  };

  // Handle modal close with unsaved changes check
  const handleCloseModal = () => {
    if (hasChanges) {
      // Show custom confirmation modal
      setConfirmationAction("close");
      setShowConfirmationModal(true);
    } else {
      setShowModal(false);
      setEditingUserId(null);
      setHasChanges(false); // Reset flag when closing
    }
  };

  // Handle confirmation modal actions
  const handleConfirmationYes = () => {
    setShowConfirmationModal(false);
    if (confirmationAction === "close") {
      setShowModal(false);
      setEditingUserId(null);
      setHasChanges(false); // Reset flag when closing
    }
    setConfirmationAction(null);
  };

  const handleConfirmationNo = () => {
    setShowConfirmationModal(false);
    setConfirmationAction(null);
  };

  const selectedUser = users.find((u) => u.id === editingUserId);

  // Filter users based on search input
  const filteredUsers =
    searchInput.trim() === ""
      ? users
      : users
          .filter((user) => {
            const nameToSearch = user.fullName || "unknown";
            return (
              nameToSearch.toLowerCase().includes(searchInput.toLowerCase()) ||
              user.username.toLowerCase().includes(searchInput.toLowerCase())
            );
          })
          .slice(0, 8); // Limit to 8 results

  return (
    <div className="page-container main-layout">
      <h2>Nhập ngày công tháng {monthLabel}</h2>

      <div className="month-selector">
        <div className="selector-group">
          <label htmlFor="yearSelect">Năm: </label>
          <select
            id="yearSelect"
            value={selectedYear}
            onChange={(e) => {
              const newYear = parseInt(e.target.value);
              setSelectedYear(newYear);
            }}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="selector-group">
          <label htmlFor="monthSelect">Tháng: </label>
          <select
            id="monthSelect"
            value={selectedMonth}
            onChange={(e) => {
              const newMonth = parseInt(e.target.value);
              if (isFutureDate(selectedYear, newMonth)) {
                showToast(
                  `Không được nhập dữ liệu cho tháng trong tương lai`,
                  "error",
                );
              } else {
                setSelectedMonth(newMonth);
              }
            }}
          >
            {months.map((month) => {
              const isDisabled = isFutureDate(selectedYear, month.value);
              return (
                <option
                  key={month.value}
                  value={month.value}
                  disabled={isDisabled}
                >
                  {month.label}
                </option>
              );
            })}
          </select>
        </div>
        {isFutureDate(selectedYear, selectedMonth) && (
          <div className="selector-warning">
            ⚠️ Không được nhập dữ liệu cho tháng trong tương lai
          </div>
        )}
        <div className="selector-group">
          <label htmlFor="userSearch">Chọn nhân viên: </label>
          <div className="search-wrapper">
            <input
              ref={searchInputRef}
              id="userSearch"
              type="text"
              placeholder="Nhập tên nhân viên..."
              value={searchInput}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              className="search-input"
            />
            {showDropdown && (
              <div
                className="dropdown-list"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: "220px",
                }}
              >
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`dropdown-item ${selectedUserIds.includes(user.id) ? "active" : ""}`}
                      onClick={() => handleSelectUser(user)}
                      title={user.username}
                    >
                      <div className="item-name">{user.fullName}</div>
                    </div>
                  ))
                ) : (
                  <div className="dropdown-empty">Không tìm thấy nhân viên</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingUserId && selectedUser && showModal && (
        <div className="modal-overlay">
          <div className="modal-content-wrapper">
            <div className="modal-header">
              <h3>
                Nhập công cho: <strong>{selectedUser.fullName}</strong>
              </h3>
              <button className="modal-close-button" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Salary Section */}
              <div className="salary-section">
                <h4 className="salary-section-title">Tiền phải trả</h4>
                <div className="salary-inputs-grid">
                  {salaryComponents.map((component) => {
                    const currentValue =
                      (salaryData[editingUserId] || {})[component.id] || "0";
                    // Format for display
                    const numValue = currentValue
                      ? parseFloat(currentValue)
                      : 0;
                    const formattedCurrency = new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      minimumFractionDigits: 0,
                    }).format(numValue);
                    const hasValue =
                      currentValue && parseFloat(currentValue) > 0;
                    return (
                      <div
                        key={component.id}
                        className={`salary-input-group ${hasValue ? "has-value" : ""}`}
                      >
                        <label htmlFor={`salary-${component.id}`}>
                          {component.label}
                        </label>
                        <input
                          id={`salary-${component.id}`}
                          type="number"
                          value={currentValue}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            if (
                              rawValue === "" ||
                              (rawValue.length <= 15 && parseInt(rawValue) >= 0)
                            ) {
                              setHasChanges(true); // Đánh dấu có thay đổi
                              setSalaryData({
                                ...salaryData,
                                [editingUserId]: {
                                  ...(salaryData[editingUserId] || {}),
                                  [component.id]: rawValue,
                                },
                              });
                            }
                          }}
                          placeholder="0"
                          min="0"
                          className="salary-input"
                          disabled={isFutureDate(selectedYear, selectedMonth)}
                        />
                        <div className="salary-display-value">
                          {formattedCurrency}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Advance Payment Section */}
              <div className="advance-section">
                <div className="advance-section-header">
                  <h4 className="salary-section-title">Tiền tạm ứng</h4>
                  <button
                    className="btn-add-advance"
                    onClick={addAdvanceEntry}
                    title="Thêm mục tạm ứng"
                    disabled={isFutureDate(selectedYear, selectedMonth)}
                  >
                    <i className="fa-solid fa-plus"></i>
                  </button>
                </div>
                {(() => {
                  const advanceEntries = advanceData[editingUserId] || [];

                  return advanceEntries.map((entry, index) => {
                    return (
                      <div key={index} className="advance-entry">
                        <div className="advance-inputs-grid">
                          <div
                            className={`advance-input-group ${entry.date ? "has-value" : ""}`}
                          >
                            <label
                              htmlFor={`advance-date-${editingUserId}-${index}`}
                            >
                              Ngày ứng lương
                            </label>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <input
                                id={`advance-date-${editingUserId}-${index}`}
                                type="number"
                                min="1"
                                max={getMaxDayForMonth(selectedMonth, selectedYear)}
                                value={getDayFromDate(entry.date) || ""}
                                onChange={(e) => {
                                  const day = e.target.value;
                                  const fullDate = day ? constructDateWithDay(parseInt(day)) : "";
                                  updateAdvanceEntry(index, "date", fullDate);
                                }}
                                className="advance-input"
                                placeholder="Ngày"
                                style={{ width: '60px' }}
                              />
                              <span style={{ color: '#666', fontWeight: '500' }}>/{String(selectedMonth).padStart(2, '0')}/{selectedYear}</span>
                            </div>
                            {entry.date && (
                              <div className="salary-display-value">
                                {formatDateDisplay(entry.date)}
                              </div>
                            )}
                          </div>
                          <div
                            className={`advance-input-group ${entry.amount ? "has-value" : ""}`}
                          >
                            <label
                              htmlFor={`advance-amount-${editingUserId}-${index}`}
                            >
                              Số tiền
                            </label>
                            <input
                              id={`advance-amount-${editingUserId}-${index}`}
                              type="number"
                              value={entry.amount || ""}
                              onChange={(e) =>
                                updateAdvanceEntry(
                                  index,
                                  "amount",
                                  e.target.value,
                                )
                              }
                              placeholder="0"
                              min="0"
                              className="advance-input"
                              disabled={isFutureDate(
                                selectedYear,
                                selectedMonth,
                              )}
                            />
                            {(() => {
                              const advanceAmount = entry.amount || "0";
                              const numValue = advanceAmount
                                ? parseFloat(advanceAmount)
                                : 0;
                              const formattedCurrency = new Intl.NumberFormat(
                                "vi-VN",
                                {
                                  style: "currency",
                                  currency: "VND",
                                  minimumFractionDigits: 0,
                                },
                              ).format(numValue);
                              return (
                                <div className="salary-display-value">
                                  {formattedCurrency}
                                </div>
                              );
                            })()}
                          </div>
                          <div
                            className={`advance-input-group ${entry.note ? "has-value" : ""}`}
                          >
                            <label
                              htmlFor={`advance-note-${editingUserId}-${index}`}
                            >
                              Ghi chú
                            </label>
                            <input
                              id={`advance-note-${editingUserId}-${index}`}
                              type="text"
                              value={entry.note || ""}
                              onChange={(e) =>
                                updateAdvanceEntry(
                                  index,
                                  "note",
                                  e.target.value,
                                )
                              }
                              placeholder="Nhập ghi chú"
                              className="advance-input"
                              disabled={isFutureDate(
                                selectedYear,
                                selectedMonth,
                              )}
                            />
                            {(advanceData[editingUserId] || []).length > 0 && (
                              <button
                                className="btn-remove-advance"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeAdvanceEntry(index);
                                }}
                                title="Xóa mục tạm ứng"
                                disabled={isFutureDate(
                                  selectedYear,
                                  selectedMonth,
                                )}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Timesheet Summary */}
              {(() => {
                const timesheetDataForUser = currentTimesheetData;
                const daysWithData = Object.entries(
                  timesheetDataForUser,
                ).filter(
                  ([_, data]) =>
                    data.standardWorkDays > 0 || data.overtimeHours > 0,
                ).length;
                const totalStandardDays = Object.values(
                  timesheetDataForUser,
                ).reduce((sum, data) => sum + (data.standardWorkDays || 0), 0);
                const totalOvertimeHours = Object.values(
                  timesheetDataForUser,
                ).reduce((sum, data) => sum + (data.overtimeHours || 0), 0);

                return (
                  <div className="timesheet-summary">
                    <h4>Tóm tắt ngày công</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Số ngày nhập:</span>
                        <span className="summary-value">
                          {daysWithData} ngày
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Công chuẩn:</span>
                        <span className="summary-value">
                          {totalStandardDays.toFixed(1)}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Tăng ca:</span>
                        <span className="summary-value">
                          {totalOvertimeHours.toFixed(1)} giờ
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Calendar Button */}
              <div className="calendar-section">
                <button
                  className="calendar-header-btn"
                  onClick={() => setShowCalendarModal(true)}
                >
                  <FontAwesomeIcon icon={faCalendarDays} /> Nhập/Chỉnh sửa ngày
                  công
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-button modal-button-cancel"
                onClick={handleCloseModal}
              >
                Đóng
              </button>
              <button
                className="modal-button modal-button-save"
                onClick={handleSave}
                disabled={isFutureDate(selectedYear, selectedMonth)}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUserIds.length > 0 && (
        <div className="employee-cards-container">
          <label className="cards-label">Nhân viên đã chọn:</label>
          <div className="employee-cards-grid">
            {userUpdateOrder.slice(0, 5).map((userId) => {
              const user = users.find((u) => u.id === userId);
              if (!user) return null;

              return (
                <div key={userId} className="employee-card">
                  <div className="employee-card-header">
                    <div className="employee-name">{user.fullName}</div>
                    <button
                      className="employee-card-remove"
                      onClick={() => {
                        // Remove from selectedUserIds
                        const updatedUserIds = selectedUserIds.filter(
                          (id) => id !== userId,
                        );
                        setSelectedUserIds(updatedUserIds);

                        // Remove from userUpdateOrder
                        const updatedOrder = userUpdateOrder.filter(
                          (id) => id !== userId,
                        );
                        setUserUpdateOrder(updatedOrder);

                        // Clear associated data
                        setTimesheetData((prev) => {
                          const updated = { ...prev };
                          delete updated[userId];
                          return updated;
                        });

                        setSalaryData((prev) => {
                          const updated = { ...prev };
                          delete updated[userId];
                          return updated;
                        });

                        // Close modal if this user was being edited
                        if (editingUserId === userId) {
                          setShowModal(false);
                          setEditingUserId(null);
                        }
                      }}
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="employee-card-footer">
                    <button
                      className="employee-card-button"
                      onClick={() => {
                        // Initialize original salary data from current state
                        setOriginalSalaryData((prev) => ({
                          ...prev,
                          [userId]: { ...(salaryData[userId] || {}) },
                        }));
                        setEditingUserId(userId);
                        setShowModal(true);
                      }}
                    >
                      Xem
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Selection Modal */}
      {showCalendarModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCalendarModal(false)}
        >
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <button
                className="calendar-nav-btn"
                onClick={() => {
                  if (selectedDateInModal) {
                    const [y, m, d] = selectedDateInModal.split("-");
                    const newDate = new Date(
                      parseInt(y),
                      parseInt(m) - 1,
                      parseInt(d) - 1,
                    );
                    if (newDate.getDate() > 0) {
                      setSelectedDateInModal(
                        `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}-${String(newDate.getDate()).padStart(2, "0")}`,
                      );
                    }
                  }
                }}
              >
                ←
              </button>
              <span className="calendar-title">
                <FontAwesomeIcon icon={faCalendarDays} /> Chọn ngày công
              </span>
              <button
                className="calendar-nav-btn"
                onClick={() => {
                  if (selectedDateInModal) {
                    const [y, m, d] = selectedDateInModal.split("-");
                    const newDate = new Date(
                      parseInt(y),
                      parseInt(m) - 1,
                      parseInt(d) + 1,
                    );
                    const daysInMonth = getMonthDays(
                      selectedYear,
                      selectedMonth,
                    );
                    if (newDate.getDate() <= daysInMonth) {
                      setSelectedDateInModal(
                        `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}-${String(newDate.getDate()).padStart(2, "0")}`,
                      );
                    }
                  }
                }}
              >
                →
              </button>
            </div>

            <div className="calendar-modal-body">
              {/* Calendar Grid */}
              <div className="calendar-month-grid">
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                  <div key={day} className="calendar-weekday">
                    {day}
                  </div>
                ))}
                {(() => {
                  const firstDay = new Date(
                    selectedYear,
                    selectedMonth - 1,
                    1,
                  ).getDay();
                  const days = [];

                  // Empty cells before first day
                  for (let i = 0; i < firstDay; i++) {
                    days.push(
                      <div
                        key={`empty-${i}`}
                        className="calendar-day empty"
                      ></div>,
                    );
                  }

                  // Days of month
                  for (let day = 1; day <= currentMonthDays; day++) {
                    const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dateObj = new Date(
                      selectedYear,
                      selectedMonth - 1,
                      day,
                    );
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isFutureDate = dateObj > today;
                    const isSelected = selectedDateInModal === dateKey;
                    const dayData = currentTimesheetData[dateKey];
                    const hasData =
                      dayData &&
                      (dayData.standardWorkDays > 0 ||
                        dayData.overtimeHours > 0 ||
                        dayData.note);

                    days.push(
                      <div
                        key={dateKey}
                        className={`calendar-day ${isSelected ? "selected" : ""} ${isFutureDate ? "future" : ""} ${hasData ? "has-data" : ""}`}
                        onClick={() =>
                          !isFutureDate && setSelectedDateInModal(dateKey)
                        }
                      >
                        <div className="day-number">{day}</div>
                        {hasData && <div className="day-indicator">●</div>}
                      </div>,
                    );
                  }

                  return days;
                })()}
              </div>

              {/* Date Details Form */}
              {selectedDateInModal &&
                (() => {
                  const [y, m, d] = selectedDateInModal.split("-");
                  const dateObj = new Date(
                    parseInt(y),
                    parseInt(m) - 1,
                    parseInt(d),
                  );
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isFutureDate = dateObj > today;
                  const dayData = currentTimesheetData[selectedDateInModal] || {
                    standardWorkDays: 0,
                    overtimeHours: 0,
                    note: "",
                  };

                  const dateStr = dateObj.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });

                  return (
                    <div className="calendar-date-details">
                      <h4>{dateStr}</h4>
                      <div className="date-form">
                        <div className="form-group">
                          <label>Công chuẩn</label>
                          <input
                            type="number"
                            value={
                              dayData.standardWorkDays !== undefined
                                ? dayData.standardWorkDays
                                : 0
                            }
                            onChange={(e) =>
                              handleTimesheetChange(
                                selectedDateInModal,
                                "standardWorkDays",
                                e.target.value,
                              )
                            }
                            min="0"
                            max="1"
                            step="0.5"
                            disabled={isFutureDate}
                            placeholder="0"
                          />
                        </div>

                        <div className="form-group">
                          <label>Tăng ca (giờ)</label>
                          <input
                            type="number"
                            value={
                              dayData.overtimeHours !== undefined
                                ? dayData.overtimeHours
                                : 0
                            }
                            onChange={(e) =>
                              handleTimesheetChange(
                                selectedDateInModal,
                                "overtimeHours",
                                e.target.value,
                              )
                            }
                            min="0"
                            step="0.5"
                            disabled={isFutureDate}
                            placeholder="0"
                          />
                        </div>

                        <div className="form-group">
                          <label>Ghi chú</label>
                          {noteInputMode[selectedDateInModal] ? (
                            <div className="note-input-container">
                              <input
                                type="text"
                                value={dayData.note || ""}
                                onChange={(e) =>
                                  handleTimesheetChange(
                                    selectedDateInModal,
                                    "note",
                                    e.target.value,
                                  )
                                }
                                placeholder="Nhập ghi chú..."
                                disabled={isFutureDate}
                                autoFocus
                              />
                              <button
                                className="note-back-button"
                                onClick={() =>
                                  setNoteInputMode({
                                    ...noteInputMode,
                                    [selectedDateInModal]: false,
                                  })
                                }
                                disabled={isFutureDate}
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <div className="note-dropdown-wrapper">
                              <button
                                className="note-dropdown-button"
                                onClick={() =>
                                  setNoteDropdownOpen({
                                    ...noteDropdownOpen,
                                    [selectedDateInModal]:
                                      !noteDropdownOpen[selectedDateInModal],
                                  })
                                }
                                disabled={isFutureDate}
                              >
                                {dayData.note || "Chọn ghi chú..."}
                              </button>
                              {noteDropdownOpen[selectedDateInModal] &&
                                !isFutureDate && (
                                  <div className="note-dropdown-menu">
                                    {noteOptions.map((option) => (
                                      <div
                                        key={option.value}
                                        className="note-option"
                                        onClick={() => {
                                          if (option.value === "khác") {
                                            handleTimesheetChange(
                                              selectedDateInModal,
                                              "note",
                                              "",
                                            );
                                            setNoteInputMode({
                                              ...noteInputMode,
                                              [selectedDateInModal]: true,
                                            });
                                          } else {
                                            handleTimesheetChange(
                                              selectedDateInModal,
                                              "note",
                                              option.value,
                                            );
                                          }
                                          setNoteDropdownOpen({
                                            ...noteDropdownOpen,
                                            [selectedDateInModal]: false,
                                          });
                                        }}
                                      >
                                        {option.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        className="calendar-modal-close-btn"
                        onClick={() => setShowCalendarModal(false)}
                      >
                        Đóng
                      </button>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmationModal && (
        <div className="modal-overlay" onClick={handleConfirmationNo}>
          <div
            className="confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirmation-modal-content">
              <h3>Xác nhận</h3>
              <p>Bạn vẫn chưa Lưu có chắc muốn Đóng không ?</p>
              <div className="confirmation-modal-buttons">
                <button
                  className="btn btn-cancel"
                  onClick={handleConfirmationNo}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-confirm"
                  onClick={handleConfirmationYes}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InputWorkDay;
