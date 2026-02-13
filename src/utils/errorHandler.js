/**
 * Đưa người dùng đến trang lỗi với thông tin cụ thể
 * @param {string} message - Thông báo lỗi
 * @param {string} code - Mã lỗi (default: 500)
 * @param {string} details - Chi tiết lỗi (stack trace, etc.)
 * @param {boolean} useNavigate - Nếu false, sẽ dùng window.location.href
 */
export const navigateToError = (navigate, message = 'Có lỗi xảy ra', code = '500', details = '') => {
  if (navigate) {
    navigate('/error', {
      state: {
        code,
        message,
        details,
      },
    });
  } else {
    // Fallback: sử dụng window.location khi navigate không available
    sessionStorage.setItem('lastError', JSON.stringify({
      code,
      message,
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

  console.error('[Error Handler]', {
    message: errorMessage,
    code: errorCode,
    stack: errorStack,
  });

  // Navigate to error page
  navigateToError(navigate, errorMessage, errorCode, errorStack);
};
