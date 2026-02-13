# Error Handling Documentation

## Cấu trúc Error Handling

Project này có hệ thống error handling bao gồm:

### 1. **Error Page** (`src/pages/ErrorPage/`)
- Trang hiển thị lỗi với giao diện chuyên nghiệp
- Nút "Quay lại" và "Trang chủ"
- Hiển thị chi tiết lỗi (stack trace) cho developer

### 2. **Error Boundary** (`src/components/ErrorBoundary.jsx`)
- Bắt mọi lỗi xảy ra từ React components
- Tự động chuyển hướng đến trang lỗi
- Lưu thông tin lỗi để hiển thị trên error page

### 3. **Error Handler Utilities** (`src/utils/errorHandler.js`)
- Hàm utility để chuyển hướng đến error page
- Hàm xử lý lỗi từ try-catch blocks
- Custom hooks để dùng trong components

---

## Cách Sử Dụng

### A. Lỗi từ React Component (Tự động xử lý)
```jsx
// ErrorBoundary sẽ tự động bắt lỗi này
function MyComponent() {
  const data = undefined.property; // Lỗi!
  // Sẽ tự động chuyển hướng đến /error
}
```

### B. Lỗi từ Async Operations (API calls)
```jsx
import { useNavigate } from 'react-router-dom';
import { navigateToError } from '../utils/errorHandler';

function MyComponent() {
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
    } catch (error) {
      // Chuyển hướng đến error page
      navigateToError(
        navigate,
        error.message || 'Lỗi tải dữ liệu',
        '500',
        error.stack
      );
    }
  };

  return <button onClick={loadData}>Load Data</button>;
}
```

### C. Sử dụng Custom Hook
```jsx
import { useErrorHandler } from '../utils/errorHandler';
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  const showError = useErrorHandler();

  const handleAction = async () => {
    try {
      // Do something
    } catch (error) {
      showError(error.message, '500', error.stack);
    }
  };
}
```

### D. Điều hướng thủ công đến Error Page
```jsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleError = () => {
    navigate('/error', {
      state: {
        code: '404',
        message: 'Trang không tìm thấy',
        details: '',
      },
    });
  };
}
```

---

## Error Codes

| Code | Ý Nghĩa |
|------|---------|
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 401 | Unauthorized - Chưa đăng nhập |
| 403 | Forbidden - Không có quyền truy cập |
| 404 | Not Found - Trang/resource không tìm thấy |
| 500 | Internal Server Error - Lỗi máy chủ |
| 503 | Service Unavailable - Dịch vụ tạm không khả dụng |

---

## Thêm Error Handling vào InputWorkDay Component

Ví dụ cập nhật handleSave để xử lý lỗi tốt hơn:

```jsx
const handleSave = async () => {
  if (!editingUserId) {
    showToast("Vui lòng chọn nhân viên!", "error");
    return;
  }

  try {
    // Existing code...
    
    if (failureCount > 0 || salaryFailCount > 0) {
      console.warn('Some saves failed', { errors, salaryErrors });
      // Có thể thêm: navigate('/error', {...})
    }
  } catch (error) {
    console.error('[Timesheet Save Fatal Error]', error);
    showToast("Lỗi khi lưu dữ liệu!", "error");
    
    // Option: Navigate to error page for fatal errors
    // navigateToError(navigate, error.message, '500', error.stack);
  }
};
```

---

## Testing Error Handling

### 1. Test Error Boundary
Click button có lỗi trong component:
```jsx
<button onClick={() => {
  const x = undefined;
  x.property; // Sẽ trigger Error Boundary
}}>
  Trigger Error
</button>
```

### 2. Test Error Page Manually
Điều hướng trực tiếp: `/error?error=test`

### 3. Test Toast Notifications
Các error messages sẽ hiện toast thay vì error page

---

## Best Practices

1. **Dùng Toast** cho những lỗi non-fatal (validation, missing fields)
2. **Dùng Error Page** cho những lỗi fatal (server error, critical failures)
3. **Lưu Error Logs** cho debugging (hiện tại là console.error)
4. **User-Friendly Messages** - Không hiển thị raw error messages cho user
5. **Error Recovery** - Cung cấp nút "Quay lại" hoặc "Thử lại"

---

## Future Enhancements

- [ ] Integrate with error tracking service (Sentry, LogRocket)
- [ ] Add retry mechanism
- [ ] Better error categorization
- [ ] Export error logs
- [ ] Error analytics dashboard
