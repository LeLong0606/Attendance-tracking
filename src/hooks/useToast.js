import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

/**
 * Custom hook để sử dụng toast notifications
 * @returns {Object} { showToast, removeToast }
 * 
 * Usage:
 * const { showToast } = useToast();
 * showToast('Thành công!', 'success');
 * showToast('Lỗi!', 'error');
 * showToast('Cảnh báo!', 'warning');
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  
  return context;
};
