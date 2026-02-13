import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faXmarkCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
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
        return faCheckCircle;
      case 'error':
        return faXmarkCircle;
      case 'warning':
        return faExclamationTriangle;
      default:
        return faCheckCircle;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            <FontAwesomeIcon 
              icon={getIcon(toast.type)} 
              className={`toast-icon toast-icon-${toast.type}`}
            />
            <span className="toast-message">{toast.message}</span>
          </div>
          <div className="toast-border"></div>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
