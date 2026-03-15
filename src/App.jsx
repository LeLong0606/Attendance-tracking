import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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

  // Hiển thị toast sau khi bị redirect do 401/403
  useEffect(() => {
    if (location.pathname !== ROUTES.LOGIN) return;

    const shouldSkipExpiredToast = sessionStorage.getItem('skip-auth-expired-toast') === '1';
    if (shouldSkipExpiredToast) {
      sessionStorage.removeItem('skip-auth-expired-toast');
      sessionStorage.removeItem('auth-expired-toast');
      return;
    }

    const shouldShowExpiredToast = sessionStorage.getItem('auth-expired-toast') === '1';
    if (shouldShowExpiredToast) {
      toast.showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'warning');
      sessionStorage.removeItem('auth-expired-toast');
    }
  }, [location.pathname, toast]);

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
      const shouldSkipExpiredToast = sessionStorage.getItem('skip-auth-expired-toast') === '1';
      if (shouldSkipExpiredToast) {
        sessionStorage.removeItem('skip-auth-expired-toast');
        navigate(ROUTES.LOGIN);
        return;
      }
      toast.showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 'warning');
      navigate(ROUTES.LOGIN);
    }
  }, [location.pathname, navigate]);

  //  Không cần lắng nghe tokenExpired event nữa vì đã redirect trực tiếp trong interceptor
  //  Toast sẽ hiện sau khi redirect qua sessionStorage flag 'auth-expired-toast'

  //  Lắng nghe BroadcastChannel từ các tab khác
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('auth-channel');
      channel.onmessage = (event) => {
        if (event.data.type === 'TOKEN_EXPIRED') {
          window.location.href = '/';
        }
      };
      return () => channel.close();
    } catch (error) {
    }
  }, [navigate]);

  //  Lắng nghe storage event từ các tab khác (fallback)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if ((e.key === STORAGE_TOKEN && e.newValue === null) || 
          (e.key === 'logout-event' && e.newValue !== null)) {
        window.location.href = '/';
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePassword />} />
        <Route path={ROUTES.MAIN} element={<Main />} />
        <Route path={ROUTES.ERROR} element={<ErrorPage />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

function App() {
  const routerBaseName = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <ToastProvider>
      <Router basename={routerBaseName}>
        <AppContent />
        <ToastContainer />
      </Router>
    </ToastProvider>
  );
}

export default App;

