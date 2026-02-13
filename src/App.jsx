import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login/Login';
import Main from './pages/AdminPage/Main';
import ErrorPage from './pages/ErrorPage/ErrorPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/main" element={<Main />} />
            <Route path="/error" element={<ErrorPage />} />
          </Routes>
        </ErrorBoundary>
        <ToastContainer />
      </Router>
    </ToastProvider>
  );
}

export default App;

