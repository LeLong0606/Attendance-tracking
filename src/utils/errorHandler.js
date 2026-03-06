/**
 * Việt hóa error message từ tiếng Anh sang tiếng Việt
 * @param {string|Object} errorMessage - Thông báo lỗi gốc hoặc object lỗi
 * @returns {string} Thông báo lỗi được việt hóa
 */
export const translateErrorMessage = (errorMessage) => {
  if (!errorMessage) return 'Lỗi hệ thống. Vui lòng thử lại sau.';

  const fieldNameMap = {
    NewPassword: 'Mật khẩu mới',
    ConfirmNewPassword: 'Xác nhận mật khẩu mới',
    OldPassword: 'Mật khẩu cũ',
    Username: 'Tên đăng nhập',
    Password: 'Mật khẩu',
    FullName: 'Họ và tên',
    Email: 'Email',
    PhoneNumber: 'Số điện thoại',
    DateOfBirth: 'Ngày sinh',
    Gender: 'Giới tính',
  };

  const formatValidationErrors = (errors) => {
    if (!errors || typeof errors !== 'object') return '';

    return Object.entries(errors)
      .flatMap(([field, messages]) => {
        const label = fieldNameMap[field] || field;
        const messageList = Array.isArray(messages) ? messages : [messages];
        return messageList
          .filter(Boolean)
          .map((msg) => `${label}: ${msg}`);
      })
      .join('\n');
  };

  const payload = errorMessage?.response?.data || errorMessage?.data || errorMessage;
  const validationDetail = formatValidationErrors(payload?.errors);
  if (validationDetail) {
    const baseMessage = payload?.message || 'Dữ liệu đầu vào không hợp lệ.';
    return `${baseMessage}\n${validationDetail}`;
  }

  const messageText = typeof errorMessage === 'string'
    ? errorMessage
    : (payload?.message || errorMessage?.message || errorMessage?.toString?.() || '');

  const errorStr = messageText.toLowerCase();

  // Network errors
  if (errorStr.includes('network') || errorStr.includes('failed to fetch')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối Internet của bạn.';
  }

  // Connection timeout
  if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
    return 'Hết thời gian chờ kết nối. Vui lòng thử lại.';
  }

  // Server errors (5xx)
  if (errorStr.includes('500') || errorStr.includes('503') || errorStr.includes('502')) {
    return 'Máy chủ đang bảo trì. Vui lòng thử lại sau.';
  }

  // Unauthorized/Forbidden
  if (errorStr.includes('401') || errorStr.includes('unauthorized')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (errorStr.includes('403') || errorStr.includes('forbidden')) {
    return 'Bạn không có quyền truy cập tài nguyên này.';
  }

  // Not found
  if (errorStr.includes('404') || errorStr.includes('not found')) {
    return 'Không tìm thấy dữ liệu yêu cầu.';
  }

  // Bad request
  if (errorStr.includes('400') || errorStr.includes('bad request')) {
    return 'Thông tin gửi không hợp lệ. Vui lòng kiểm tra lại.';
  }

  // CORS error
  if (errorStr.includes('cors')) {
    return 'Lỗi hệ thống. Vui lòng liên hệ quản trị viên.';
  }

  // ERR_CONNECTION_REFUSED
  if (errorStr.includes('econnrefused') || errorStr.includes('connection refused')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
  }

  // Generic error - return original message if it's already in Vietnamese
  if (/[À-ỿ]/.test(messageText)) {
    return messageText;
  }

  // Default fallback
  return 'Lỗi hệ thống. Vui lòng thử lại sau.';
};

/**
 * Đưa người dùng đến trang lỗi với thông tin cụ thể
 * @param {string} message - Thông báo lỗi
 * @param {string} code - Mã lỗi (default: 500)
 * @param {string} details - Chi tiết lỗi (stack trace, etc.)
 * @param {boolean} useNavigate - Nếu false, sẽ dùng window.location.href
 */
export const navigateToError = (navigate, message = 'Có lỗi xảy ra', code = '500', details = '') => {
  const translatedMessage = translateErrorMessage(message);
  if (navigate) {
    navigate('/error', {
      state: {
        code,
        message: translatedMessage,
        details,
      },
    });
  } else {
    // Fallback: sử dụng window.location khi navigate không available
    sessionStorage.setItem('lastError', JSON.stringify({
      code,
      message: translatedMessage,
      details,
    }));
    window.location.href = '/error';
  }
};

/**
 * Custom hook để sử dụng navigate error trong components
 */
export const useErrorHandler = () => {
  const { useNavigate } = require('react-router-dom');
  const navigate = useNavigate();

  return (message = 'Có lỗi xảy ra', code = '500', details = '') => {
    navigateToError(navigate, message, code, details);
  };
};

/**
 * Xử lý lỗi từ try-catch block
 * Ngoài ra có thể thêm logging, tracking, etc.
 */
export const handleErrorGracefully = (error, navigate, customMessage = null) => {
  const errorMessage = customMessage || error?.message || 'Có lỗi xảy ra';
  const errorStack = error?.stack || '';
  const errorCode = error?.code || '500';

  // Navigate to error page
  navigateToError(navigate, errorMessage, errorCode, errorStack);
};
