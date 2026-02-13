import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import './ErrorPage.css';

function ErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorData, setErrorData] = useState(null);
  
  useEffect(() => {
    // Get error from location state first
    if (location.state?.message) {
      setErrorData({
        code: location.state?.code || '500',
        message: location.state?.message || 'Có lỗi xảy ra',
        details: location.state?.details || ''
      });
    } else {
      // Try to get from sessionStorage (from ErrorBoundary)
      const storedError = sessionStorage.getItem('lastError');
      if (storedError) {
        setErrorData(JSON.parse(storedError));
        sessionStorage.removeItem('lastError'); // Clear after reading
      } else {
        // Default error
        setErrorData({
          code: '500',
          message: 'Có lỗi xảy ra',
          details: ''
        });
      }
    }
  }, [location.state]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!errorData) {
    return null; // Loading
  }

  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">
          <FontAwesomeIcon icon={faExclamationTriangle} />
        </div>
        
        <h1 className="error-code">{errorData.code}</h1>
        <h2 className="error-title">Lỗi</h2>
        
        <p className="error-message">{errorData.message}</p>
        
        {errorData.details && (
          <div className="error-details">
            <details>
              <summary>Chi tiết lỗi</summary>
              <pre>{errorData.details}</pre>
            </details>
          </div>
        )}
        
        <div className="error-buttons">
          <button 
            className="btn-back"
            onClick={handleGoBack}
            title="Quay lại trang trước"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Quay lại
          </button>
          
          <button 
            className="btn-home"
            onClick={handleGoHome}
            title="Về trang chủ"
          >
            <FontAwesomeIcon icon={faHome} />
            Trang chủ
          </button>
        </div>
        
        <div className="error-illustration">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#ef4444" strokeWidth="2"/>
            <line x1="60" y1="60" x2="140" y2="140" stroke="#ef4444" strokeWidth="3"/>
            <line x1="140" y1="60" x2="60" y2="140" stroke="#ef4444" strokeWidth="3"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
