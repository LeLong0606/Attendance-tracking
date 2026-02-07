import { useState, useEffect } from "react";
import { getUserRole } from "../../services/permissions";
import { USER_ROLES } from "../../services/constants";
import ManageProfile from "./CreateUser/ManageProfile";
import InputWorkDay from "./InputWorkDay/InputWorkDay";
import WorkDayTable from "./ViewWorkDayTable/WorkDayTable";
import ManageAccount from "./ManageAccount";
import './ProfilePage.css';

function ProfilePage() {
  const userRole = getUserRole();
  const isHR = userRole === USER_ROLES.HR;
  
  // HR users should start with viewWorkDayTable (option 3)
  const initialActive = isHR ? "3" : "1";
  const initialPage = isHR ? <WorkDayTable /> : <ManageProfile />;
  
  const [page, setPage] = useState(initialPage);
  const [active, setActive] = useState(initialActive);

  const handlePageChange = (e) => {
    // HR users can only view work day table
    if (isHR) {
      return;
    }
    
    switch (e.target.innerText) {
      case "Tạo tài khoản người dùng":
        setPage(<ManageProfile />);
        setActive("1");
        break;
      case "Nhập ngày công":
        setPage(<InputWorkDay />);
        setActive("2");
        break;
      case "Xem ngày công":
         setPage(<WorkDayTable />);
        setActive("3");
        break;
      
      default:
        setPage(<ManageProfile />);
        setActive("1");
    }
  };

  return (

    <div
      className={`profile-page-container ${
        active === "2" || active === "3" ? "layout-column" : ""
      }`}
    >
      <ManageAccount active={active} handlePageChange={handlePageChange} />
      <div className="profile-content">
        {page}
      </div>
    </div>
  );
}

export default ProfilePage;
