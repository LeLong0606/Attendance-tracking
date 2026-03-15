import { useState, useEffect, useRef } from "react";
import "./InputWorkDay.css";
import { userAPI, payrollAPI } from "../../../services/api";
import { FaPlus, FaTrash, FaCalendarAlt } from "react-icons/fa";
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

  // Tạo năm từ 2020 đến năm hiện tại
  const startYear = 2020;
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i,
  );

  // Danh sách tháng
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

  // Kiểm tra nếu ngày hiện tại đã vượt quá ngày của tháng, nếu có thì cho phép chọn tháng tiếp theo
  const isFutureDate = (year, month) => {
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  };

  // Hàm hỗ trợ định dạng YYYY-MM-DD
  const getDayFromDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split('-');
    return parts[2] || "";
  };

  // Hàm hỗ trợ lấy ngày tối đa theo tháng/năm đã chọn
  const getMaxDayForMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // Hàm hỗ trợ tạo ngày đầy đủ từ ngày nhập, dựa trên tháng/năm đã chọn
  const constructDateWithDay = (day) => {
    if (!day || day < 1) return "";
    const maxDay = getMaxDayForMonth(selectedMonth, selectedYear);
    const dayNum = parseInt(day);
    
    // Nếu ngày nhập vượt quá max day của tháng, trả về empty string để clear input
    if (dayNum > maxDay) return "";
    
    const dayStr = String(dayNum).padStart(2, '0');
    const monthStr = String(selectedMonth).padStart(2, '0');
    return `${selectedYear}-${monthStr}-${dayStr}`;
  };

  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState(() => {
    // Load selected user IDs từ localStorage
    const saved = localStorage.getItem("selectedUserIds");
    return saved ? JSON.parse(saved) : [];
  });
  const [userUpdateOrder, setUserUpdateOrder] = useState(() => {
    // Load update order từ localStorage
    const saved = localStorage.getItem("userUpdateOrder");
    return saved ? JSON.parse(saved) : [];
  });
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null); 
  const [searchInput, setSearchInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedDateInModal, setSelectedDateInModal] = useState(null); 
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); 
  const [confirmationAction, setConfirmationAction] = useState(null); 
  const [hasChanges, setHasChanges] = useState(false);
  const searchInputRef = useRef(null);

  // Sử dụng hook thông báo toast
  const { showToast } = useToast();

  // Lấy danh sách người dùng từ API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const employeeList = await userAPI.getAllUsers();
        // Bao gồm tất cả người dùng, hiển thị "unknown" nếu thiếu fullName
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
          "Lỗi tải danh sách nhân viên: " + (error.message || "Lỗi không xác định"),
          "error",
        );
      }
    };

    loadUsers();
  }, [showToast]);

  // Lưu selectedUserIds vào localStorage
  useEffect(() => {
    localStorage.setItem("selectedUserIds", JSON.stringify(selectedUserIds));
  }, [selectedUserIds]);

  // Lưu userUpdateOrder vào localStorage
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
        // Đóng tất cả dropdown ghi chú
        setNoteDropdownOpen({});
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Cập nhật vị trí dropdown khi hiển thị hoặc khi đổi kích thước cửa sổ
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
  }, [showDropdown]);

  // Reset ngày đã chọn khi mở modal lịch
  useEffect(() => {
    if (showCalendarModal && selectedYear && selectedMonth) {
      const firstDay = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      setSelectedDateInModal(firstDay);
    }
  }, [showCalendarModal, selectedYear, selectedMonth]);

  // Cập nhật vị trí khi cuộn trang
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
    // Tải từ localStorage ở lần render đầu tiên
    try {
      const saved = localStorage.getItem("timesheetData");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Chuẩn hóa: đảm bảo mọi bản ghi ngày có thuộc tính 'changed'
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

  // Lưu timesheetData vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem("timesheetData", JSON.stringify(timesheetData));
    } catch (error) {}
  }, [timesheetData]);

  const [noteDropdownOpen, setNoteDropdownOpen] = useState({});
  const [noteInputMode, setNoteInputMode] = useState({});

  // Dữ liệu API đã cache - lưu dữ liệu chấm công và lương đã tải
  const [cachedData, setCachedData] = useState({
    timesheet: {}, // { userId: { dateKey: { standardWorkDays, overtimeHours, note } } }
    salary: {}, // { userId: { componentId: amount } }
  });

  const [salaryData, setSalaryData] = useState(() => {
    // Tải từ localStorage ở lần render đầu tiên
    try {
      const saved = localStorage.getItem("salaryData");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      return {};
    }
  });

  // Chuẩn hóa dữ liệu tạm ứng - chuyển định dạng object cũ sang mảng mới
  const normalizeAdvanceData = (data) => {
    const normalized = {};
    Object.keys(data).forEach((userId) => {
      const userAdvanceData = data[userId];
      // Nếu đã là mảng thì giữ nguyên
      if (Array.isArray(userAdvanceData)) {
        normalized[userId] = userAdvanceData;
      }
      // Nếu là object có date/amount/note thì đổi thành mảng một phần tử
      else if (
        userAdvanceData &&
        typeof userAdvanceData === "object" &&
        userAdvanceData.date !== undefined
      ) {
        normalized[userId] = [userAdvanceData];
      }
      // Trường hợp khác mặc định là mảng rỗng
      else {
        normalized[userId] = [];
      }
    });
    return normalized;
  };

  const [advanceData, setAdvanceData] = useState(() => {
    // Tải từ localStorage ở lần render đầu tiên
    try {
      const saved = localStorage.getItem("advanceData");
      const parsed = saved ? JSON.parse(saved) : {};
      // Chuẩn hóa dữ liệu cũ sang định dạng mảng mới
      return normalizeAdvanceData(parsed);
    } catch (error) {
      return {};
    }
  });

  // Theo dõi dữ liệu tạm ứng gốc từ API (trước khi chỉnh sửa)
  const [originalAdvanceData, setOriginalAdvanceData] = useState({});

  // Theo dõi dữ liệu lương gốc từ API (trước khi chỉnh sửa)
  const [originalSalaryData, setOriginalSalaryData] = useState({});

  // Theo dõi ID cấu trúc lương từ API (map componentId -> salaryStructureId)
  const [salaryStructureIds, setSalaryStructureIds] = useState({});

  // Lưu salaryData vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem("salaryData", JSON.stringify(salaryData));
    } catch (error) {}
  }, [salaryData]);

  // Lưu advanceData vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem("advanceData", JSON.stringify(advanceData));
    } catch (error) {}
  }, [advanceData]);

  // Kiểm tra hợp lệ ngày tạm ứng khi thay đổi tháng/năm
  useEffect(() => {
    setAdvanceData((prevData) => {
      const updatedData = { ...prevData };
      const maxDay = getMaxDayForMonth(selectedMonth, selectedYear);

      for (const userId in updatedData) {
        if (Array.isArray(updatedData[userId])) {
          updatedData[userId] = updatedData[userId].map((entry) => {
            if (entry.date) {
              const day = parseInt(getDayFromDate(entry.date));
              // Nếu ngày vượt quá ngày tối đa của tháng thì xóa ngày
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

  // Tùy chọn ghi chú
  const noteOptions = [
    { value: "Tăng ca", label: "Tăng ca" },
    { value: "Tăng ca full", label: "Tăng ca full" },
    { value: "Tăng ca tối", label: "Tăng ca tối" },
    { value: "khác", label: "Khác" },
  ];

  // Thành phần lương
  const salaryComponents = [
    { id: 1, label: "Lương ngày công", code: "DAILY_BASE" },
    { id: 2, label: "Phụ cấp nhà trọ", code: "HOUSING" },
    { id: 3, label: "Phụ cấp xăng xe", code: "PETROL" },
    { id: 4, label: "Phụ cấp điện thoại", code: "PHONE" },
  ];

  // Lấy dữ liệu chấm công tháng của người dùng hiện tại
  const getMonthDays = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const currentMonthDays = getMonthDays(selectedYear, selectedMonth);
  const currentTimesheetData = timesheetData[editingUserId] || {};

  // Chuẩn hóa ngày sang định dạng YYYY-MM-DD cho input date HTML
  const normalizeDateFormat = (dateStr) => {
    if (!dateStr) return "";

    // Nếu đã ở định dạng YYYY-MM-DD thì trả về luôn
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Nếu ở định dạng DD/MM/YYYY thì chuyển sang YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split("/");
      return `${year}-${month}-${day}`;
    }

    // Nếu là định dạng ISO có thời gian (2026-03-01T00:00:00) thì tách phần ngày
    if (dateStr.includes("T")) {
      return dateStr.split("T")[0];
    }

    return dateStr;
  };

  // Thêm một dòng tạm ứng mới
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

  // Xóa một dòng tạm ứng
  const removeAdvanceEntry = async (index) => {
    try {
      const entries = advanceData[editingUserId] || [];
      const entryToDelete = entries[index];

      // Nếu dòng có ID thì xóa trên API trước
      if (entryToDelete && entryToDelete.id) {
        await payrollAPI.deleteAdvancePayment(entryToDelete.id);
      }

      // Cập nhật state cục bộ
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

  // Cập nhật một dòng tạm ứng
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

  // Tải dữ liệu API khi editingUserId thay đổi - luôn lấy dữ liệu mới
  useEffect(() => {
    if (!editingUserId) return;

    payrollAPI
      .getTimesheetData(editingUserId, selectedMonth, selectedYear)
      .then((apiData) => {
        let timesheetArray = [];

        // Xử lý nhiều định dạng phản hồi khác nhau
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

          // Lưu vào dữ liệu cache (dữ liệu gốc từ API)
          setCachedData((prev) => ({
            ...prev,
            timesheet: {
              ...prev.timesheet,
              [editingUserId]: { ...timesheetMap },
            },
          }));

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
        // Xử lý lỗi khi tải dữ liệu chấm công
      });

    // Luôn tải dữ liệu lương
    payrollAPI
      .getSalaryStructure(editingUserId)
      .then((apiSalaryData) => {
        let salaryArray = [];

        // Xử lý nhiều định dạng phản hồi khác nhau
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
              structureIdMap[component.id] = item.id; // Lưu ID cấu trúc lương từ API
              originalSalaryMap[component.id] = item.amount || 0; // Lưu mức tiền gốc
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
        // Xử lý lỗi khi tải dữ liệu lương
      });

    // Luôn tải dữ liệu tạm ứng
    payrollAPI
      .getAdvancePaymentData(editingUserId, selectedMonth, selectedYear)
      .then((apiAdvanceData) => {
        let advanceArray = [];

        // Xử lý nhiều định dạng phản hồi khác nhau
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
          // Ánh xạ trường từ API (advanceDate, amount, note) sang định dạng dùng trong UI (date, amount, note)
          // Lọc theo tháng và năm đã chọn
          const mappedAdvanceData = advanceArray
            .map((item) => {
              // Tách ngày từ định dạng ISO "2026-03-01T00:00:00" -> "2026-03-01"
              let dateValue = "";
              if (item.advanceDate) {
                // Tách đơn giản: lấy phần trước ký tự 'T'
                dateValue = item.advanceDate.split("T")[0];
              }
              return {
                id: item.id, // Lưu ID tạm ứng để phục vụ thao tác xóa
                date: dateValue, // Lưu theo định dạng "YYYY-MM-DD"
                amount: item.amount || "",
                note: item.note || "",
              };
            });

          // Lưu dữ liệu gốc để so sánh thay đổi
          setOriginalAdvanceData((prev) => ({
            ...prev,
            [editingUserId]: [...mappedAdvanceData],
          }));

          // Chỉ hiển thị các dòng thuộc tháng và năm đã chọn
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
          // Khởi tạo mảng rỗng cho user này nếu chưa có dữ liệu tạm ứng
          setAdvanceData((prev) => ({
            ...prev,
            [editingUserId]: [],
          }));
        }
      })
      .catch((error) => {
        // Xử lý lỗi tải dữ liệu tạm ứng - khởi tạo mảng rỗng
        setAdvanceData((prev) => ({
          ...prev,
          [editingUserId]: [],
        }));
      });
  }, [editingUserId, selectedMonth, selectedYear]);

  // Xử lý chọn người dùng - kích hoạt tải dữ liệu qua useEffect
  const handleSelectUser = (user) => {
    // Reset cờ thay đổi khi chọn người dùng mới
    setHasChanges(false);

    // Kiểm tra người dùng đã được chọn chưa
    if (selectedUserIds.includes(user.id)) {
      // Cập nhật thứ tự chỉnh sửa user - đưa lên đầu
      const newOrder = userUpdateOrder.filter((id) => id !== user.id);
      newOrder.unshift(user.id);
      setUserUpdateOrder(newOrder);

      // Chỉ đặt làm user đang chỉnh sửa
      setEditingUserId(user.id);
      setShowModal(true);
      setShowDropdown(false);
      
      // Khởi tạo dữ liệu lương gốc từ state hiện tại
      if (!originalSalaryData[user.id]) {
        setOriginalSalaryData((prev) => ({
          ...prev,
          [user.id]: { ...(salaryData[user.id] || {}) },
        }));
      }
      return;
    }

    // Thêm người dùng vào danh sách đã chọn
    const newSelectedUserIds = [...selectedUserIds, user.id];
    setSelectedUserIds(newSelectedUserIds);

    // Cập nhật thứ tự chỉnh sửa user - đưa lên đầu
    const newOrder = userUpdateOrder.filter((id) => id !== user.id);
    newOrder.unshift(user.id);
    setUserUpdateOrder(newOrder);

    // Khởi tạo dữ liệu tạm ứng cho user mới nếu chưa có
    if (!advanceData[user.id]) {
      setAdvanceData((prev) => ({
        ...prev,
        [user.id]: [],
      }));
    }

    // Khởi tạo dữ liệu lương gốc từ state hiện tại
    setOriginalSalaryData((prev) => ({
      ...prev,
      [user.id]: { ...(salaryData[user.id] || {}) },
    }));

    // Mở modal để chỉnh sửa
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

    // Kiểm tra có dữ liệu nào cần lưu không
    const currentTimesheetData = timesheetData[editingUserId] || {};
    const employeeUserData = salaryData[editingUserId] || {};
    const employeeAdvanceData = advanceData[editingUserId] || [];
    const employeeOriginalSalaryData = originalSalaryData[editingUserId] || {};

    // Kiểm tra dữ liệu chấm công có thay đổi không
    const hasTimesheetChanges = Object.values(currentTimesheetData).some(
      (dayData) => dayData.changed
    );

    // Kiểm tra dữ liệu lương có thay đổi không
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

    // Kiểm tra dữ liệu tạm ứng có thay đổi không
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

    // Nếu không có dữ liệu cần lưu thì đóng modal
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
      const newTimesheetItems = [];
      const updateTimesheetItems = [];

      // Lấy dữ liệu cache của user này
      const cachedTimesheetData = cachedData.timesheet[editingUserId] || {};

      // Chỉ gom các dòng chấm công đã thay đổi từ currentTimesheetData
      // Tách thành dòng mới (chưa có trong cache) và dòng cập nhật (đã có trong cache)
      Object.keys(currentTimesheetData).forEach((dateKey) => {
        const dayData = currentTimesheetData[dateKey];

        // Bỏ qua nếu chưa được đánh dấu thay đổi
        if (!dayData.changed) {
          return;
        }

        // Kiểm tra ngày có nằm trong tương lai không
        const [year, month, day] = dateKey.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateObj > today) {
          return; // Bỏ qua ngày trong tương lai
        }

        // Nếu changed = true thì lưu dù giá trị là 0,0,0
        const standardWorkDays =
          dayData.standardWorkDays !== undefined ? dayData.standardWorkDays : 0;
        const overtimeHours =
          dayData.overtimeHours !== undefined ? dayData.overtimeHours : 0;

        const timesheetItem = {
          workDate: dateKey,
          standardWorkDays: standardWorkDays,
          overtimeHours: overtimeHours,
          note: dayData.note || "",
        };

        // Tách thành dòng mới hoặc cập nhật dựa trên dữ liệu cache
        if (cachedTimesheetData[dateKey]) {
          // Có dữ liệu trong cache -> đây là bản cập nhật
          updateTimesheetItems.push(timesheetItem);
        } else {
          // Không có dữ liệu trong cache -> đây là dòng mới
          newTimesheetItems.push(timesheetItem);
        }
      });

      // Lưu hàng loạt các dòng chấm công mới
      if (newTimesheetItems.length > 0) {
        try {
          await payrollAPI.saveTimesheetBulk(editingUserId, newTimesheetItems);
          successCount += newTimesheetItems.length;
        } catch (error) {
          failureCount += newTimesheetItems.length;
          const errorMsg =
            error?.message || JSON.stringify(error) || "Lỗi không xác định";
          errors.push({
            bulk: true,
            itemCount: newTimesheetItems.length,
            error: errorMsg,
          });
        }
      }

      // Cập nhật từng dòng chấm công đã có
      for (const updateItem of updateTimesheetItems) {
        try {
          const updateData = {
            standardWorkDays: updateItem.standardWorkDays,
            overtimeHours: updateItem.overtimeHours,
            note: updateItem.note,
          };
          await payrollAPI.saveTimesheet(editingUserId, updateItem.workDate, updateData);
          successCount++;
        } catch (error) {
          failureCount++;
          const errorMsg =
            error?.message || JSON.stringify(error) || "Lỗi không xác định";
          errors.push({
            single: true,
            date: updateItem.workDate,
            error: errorMsg,
          });
        }
      }

      // Lưu các thành phần lương
      let salarySaveCount = 0;
      let salaryFailCount = 0;
      const salaryErrors = [];

      const employeeUserData = salaryData[editingUserId] || {};
      const employeeOriginalSalaryData = originalSalaryData[editingUserId] || {};
      const employeeSalaryStructureIds = salaryStructureIds[editingUserId] || {};

      for (const component of salaryComponents) {
        // Lấy số tiền, mặc định 0 nếu không nhập
        const componentAmount = employeeUserData[component.id];
        const currentAmount =
          componentAmount && componentAmount !== ""
            ? parseFloat(componentAmount)
            : 0;

        const originalAmount =
          employeeOriginalSalaryData[component.id] !== undefined
            ? employeeOriginalSalaryData[component.id]
            : 0;

        // Bỏ qua nếu số tiền = 0/rỗng và trước đó cũng không có dữ liệu
        if (currentAmount === 0 && originalAmount === 0) {
          continue;
        }

        // Bỏ qua nếu không có thay đổi
        if (currentAmount === originalAmount) {
          continue;
        }

        const salaryPayload = {
          amount: currentAmount,
        };

        try {
          // Nếu đã có dữ liệu gốc thì dùng PUT để cập nhật
          if (originalAmount !== 0) {
            const salaryStructureId = employeeSalaryStructureIds[component.id];
            if (salaryStructureId) {
              await payrollAPI.updateSalaryComponent(salaryStructureId, salaryPayload);
            }
          }
          // Nếu chưa có dữ liệu gốc thì dùng POST để tạo mới
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

      // Lưu các khoản tạm ứng
      let advanceSaveCount = 0;
      let advanceFailCount = 0;
      const advanceErrors = [];

      const employeeAdvanceData = advanceData[editingUserId] || [];
      const employeeOriginalAdvanceData = originalAdvanceData[editingUserId] || [];

      // Hàm hỗ trợ kiểm tra một dòng tạm ứng có thay đổi không
      const hasAdvanceChanged = (currentEntry, originalEntry) => {
        if (!originalEntry) return true; // Dòng mới
        return (
          currentEntry.date !== originalEntry.date ||
          currentEntry.amount !== originalEntry.amount ||
          currentEntry.note !== originalEntry.note
        );
      };

      for (const advance of employeeAdvanceData) {
        // Chỉ lưu các dòng có số tiền (ngày và ghi chú có thể để trống)
        if (advance.amount && advance.amount !== "") {
          // Tìm dòng gốc để so sánh
          const originalEntry = employeeOriginalAdvanceData.find(
            (orig) => orig.id === advance.id
          );

          // Kiểm tra dòng có thay đổi không
          const changed = hasAdvanceChanged(advance, originalEntry);

          // Bỏ qua nếu không có thay đổi
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
            // Nếu dòng có ID và đã thay đổi thì dùng PUT để cập nhật
            if (advance.id && changed) {
              await payrollAPI.updateAdvancePayment(advance.id, advancePayload);
            }
            // Nếu dòng chưa có ID thì dùng POST để tạo mới
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

      // Hiển thị kết quả tổng hợp
      let message = "";
      const hasSuccessfulSaves =
        successCount > 0 || salarySaveCount > 0 || advanceSaveCount > 0;
      const hasFailures =
        failureCount > 0 || salaryFailCount > 0 || advanceFailCount > 0;

      if (hasSuccessfulSaves && !hasFailures) {
        // Tất cả thao tác lưu đều thành công
        message = "Cập nhật thành công";
        showToast(message, "success");
        
        // Cập nhật dữ liệu tạm ứng gốc theo state hiện tại
        setOriginalAdvanceData((prev) => ({
          ...prev,
          [editingUserId]: [...(advanceData[editingUserId] || [])],
        }));

        // Cập nhật dữ liệu lương gốc theo state hiện tại
        setOriginalSalaryData((prev) => ({
          ...prev,
          [editingUserId]: { ...(salaryData[editingUserId] || {}) },
        }));
        
        // Đóng modal sau khi lưu thành công
        setShowModal(false);
        setEditingUserId(null);
        setHasChanges(false); // Reset flag after successful save
      } else if (hasSuccessfulSaves && hasFailures) {
        // Một phần lưu thành công, một phần thất bại
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
        // Tất cả thao tác lưu đều thất bại
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

  // Kiểm tra có thay đổi nào chưa lưu hay không
  const hasUnsavedChanges = () => {
    if (!editingUserId) return false;

    // Kiểm tra thay đổi ở dữ liệu chấm công
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

  // Xử lý đóng modal khi cần kiểm tra thay đổi chưa lưu
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

  // Xử lý hành động trong modal xác nhận
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
                    <FaPlus />
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
                                <FaTrash />
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
                  <FaCalendarAlt /> Nhập/Chỉnh sửa ngày
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
            {userUpdateOrder.slice(0, 6).map((userId) => {
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
                        // Cập nhật thứ tự chỉnh sửa user - đưa lên đầu
                        const newOrder = userUpdateOrder.filter((id) => id !== userId);
                        newOrder.unshift(userId);
                        setUserUpdateOrder(newOrder);

                        // Khởi tạo dữ liệu lương gốc từ state hiện tại
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
                    const origMonth = parseInt(m);
                    const origYear = parseInt(y);
                    const newDate = new Date(
                      parseInt(y),
                      parseInt(m) - 1,
                      parseInt(d) - 1,
                    );
                    // Chỉ cho lùi nếu vẫn ở cùng tháng/năm và ngày >= 1
                    if (
                      newDate.getMonth() + 1 === origMonth &&
                      newDate.getFullYear() === origYear &&
                      newDate.getDate() >= 1
                    ) {
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
                <FaCalendarAlt /> Chọn ngày công
              </span>
              <button
                className="calendar-nav-btn"
                onClick={() => {
                  if (selectedDateInModal) {
                    const [y, m, d] = selectedDateInModal.split("-");
                    const origMonth = parseInt(m);
                    const origYear = parseInt(y);
                    const newDate = new Date(
                      parseInt(y),
                      parseInt(m) - 1,
                      parseInt(d) + 1,
                    );
                    const daysInMonth = getMonthDays(
                      selectedYear,
                      selectedMonth,
                    );
                    // Chỉ cho tiến nếu vẫn ở cùng tháng/năm và ngày <= daysInMonth
                    if (
                      newDate.getMonth() + 1 === origMonth &&
                      newDate.getFullYear() === origYear &&
                      newDate.getDate() <= daysInMonth
                    ) {
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
