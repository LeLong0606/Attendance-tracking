import { useContext } from 'react';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { ToastContext } from '../contexts/ToastContext';
import './ToastContainer.css';

function ToastContainer() {
  const context = useContext(ToastContext);
  
  if (!context || !context.toasts) {
    return null;
  }

  const { toasts } = context;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return FaCheckCircle;
      case 'error':
        return FaTimesCircle;
      case 'warning':
        return FaExclamationTriangle;
      default:
        return FaCheckCircle;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            {(() => {
              const Icon = getIcon(toast.type);
              return <Icon className={`toast-icon toast-icon-${toast.type}`} />;
            })()}
            <span className="toast-message">{toast.message}</span>
          </div>
          <div className="toast-border"></div>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
