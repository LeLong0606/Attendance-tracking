import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Login from './pages/Login/Login';
import ChangePassword from './pages/ChangePassword/InitChangePassword';
import Main from './pages/AdminPage/Main';
import ErrorPage from './pages/ErrorPage/ErrorPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { ROUTES, STORAGE_TOKEN } from './config/constants';
import './App.css';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const hasShownToastRef = useRef(false);

  //  Reset toast flag khi login thành công (token được add vào localStorage)
  useEffect(() => {
    const handleTokenAdded = (e) => {
      // Khi token được add hoặc update
      if (e.key === STORAGE_TOKEN && location.pathname === ROUTES.LOGIN) {
        // ✅ Reset ref để lần sau nếu token expire lại sẽ show toast
        hasShownToastRef.current = false;
      }
    };
    window.addEventListener('storage', handleTokenAdded);
    return () => window.removeEventListener('storage', handleTokenAdded);
  }, []);

  //  Kiểm tra token ngay từ lúc component mount hoặc khi location thay đổi
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_TOKEN);
    // Nếu không có token và đang ở /main, redirect ngay
    if (!token && location.pathname === ROUTES.MAIN) {
      toast.showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error');
      navigate(ROUTES.LOGIN);
    }
  }, [location.pathname, navigate]);

  //  Lắng nghe tokenExpired event từ apiClient
  useEffect(() => {
    const handleTokenExpired = () => {
      toast.showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error');
      navigate(ROUTES.LOGIN);
    };
    window.addEventListener('tokenExpired', handleTokenExpired);
    return () => window.removeEventListener('tokenExpired', handleTokenExpired);
  }, [navigate]);

  //  Lắng nghe BroadcastChannel từ các tab khác
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('auth-channel');
      channel.onmessage = (event) => {
        if (event.data.type === 'TOKEN_EXPIRED') {
        
          navigate(ROUTES.LOGIN);
        }
      };
      return () => channel.close();
    } catch (error) {
      console.warn('BroadcastChannel không được hỗ trợ');
    }
  }, [navigate]);

  //  Lắng nghe storage event từ các tab khác (fallback)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if ((e.key === STORAGE_TOKEN && e.newValue === null) || 
          (e.key === 'logout-event' && e.newValue !== null)) {
        // ✅ Chỉ show toast 1 lần, tránh React Strict Mode double call
        if (!hasShownToastRef.current) {
          hasShownToastRef.current = true;
          toast.showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'error');
        }
        navigate(ROUTES.LOGIN);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.CHANGE_INIT_PASSWORD} element={<ChangePassword />} />
        <Route path={ROUTES.MAIN} element={<Main />} />
        <Route path={ROUTES.ERROR} element={<ErrorPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
        <ToastContainer />
      </Router>
    </ToastProvider>
  );
}

export default App;

