import { getUserRole } from '../../services/permissions';
import './ManageAccount.css';

function ManageAccount({ active, handlePageChange }) {
  const userRole = getUserRole();
  
  // HR users can only view work day table
  const isHR = userRole === 'hr';

  return (
    <div className="manage-account">
     
      
      <ul>
         <h2>Bảng điều khiển</h2>
        <hr></hr>
        
        {!isHR && (
          <li
            className={active === "1" ? "active" : ""}
            onClick={handlePageChange}
          >
            Tạo tài khoản người dùng
          </li>
        )}
        
        {!isHR && (
          <li
            className={active === "2" ? "active" : ""}
            onClick={handlePageChange}
          >
            Nhập ngày công
          </li>
        )}
        
        <li
          className={active === "3" ? "active" : ""}
          onClick={handlePageChange}
        >
         Xem ngày công
        </li>
       
      </ul>
    </div>
  );
}

export default ManageAccount;
