import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../presentation/hooks/useAuth';
import { useUser } from '../../presentation/hooks/useUser';
import { getUserFromToken } from '../../config/TokenHelper';
import { STORAGE_TOKEN, STORAGE_USER, STORAGE_REFRESH_TOKEN } from '../../config/constants';
import PersonalInfo from './PersonalInfor/PersonalInfo';
import StatisticsPage from './StatisticsPage/StatisticsPage';
import ManageProfile from './CreateUser/ManageProfile';
import InputWorkDay from './InputWorkDay/InputWorkDay';
import WorkDayTable from './ViewWorkDayTable/WorkDayTable';
import Sidebar from './Sidebar/Sidebar';
import Topbar from './Topbar/Topbar';
import './Main.css';

function Main() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { loadProfile } = useUser();

  useEffect(() => {
    const userInfo = getUserFromToken();
    
    if (!userInfo) {
      navigate('/');
    } else {
      setUser(userInfo);
      
      // Fetch user profile để lấy fullName từ API
      loadProfile()
        .then((profileData) => {
          // Merge profile data vào user state
          setUser(prev => ({
            ...prev,
            fullName: profileData.fullName || profileData.full_name || prev.username
          }));
        })
        .catch((err) => {
          console.error('❌ Lỗi lấy profile:', err);
          // Fallback: sử dụng username nếu không lấy được fullName
          setUser(prev => ({
            ...prev,
            fullName: prev.username
          }));
        });
    }
  }, [navigate, loadProfile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <StatisticsPage />;
      case 'profile':
        return <PersonalInfo />;
      case 'manage':
        return <ManageProfile />;
      case 'input':
        return <InputWorkDay />;
      case 'view':
        return <WorkDayTable />;
      default:
        return <StatisticsPage />;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false);
        }} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-wrapper">
        <Topbar 
          user={user} 
          avatar={avatar} 
          onAvatarChange={handleAvatarChange} 
          currentPage={currentPage}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSidebarOpen(false);
          }}
          sidebarOpen={sidebarOpen}
        />
        <main className="main-content">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
}

export default Main;



