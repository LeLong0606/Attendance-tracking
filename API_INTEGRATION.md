# API Integration Guide

**🚨 Lỗi CORS?** → Xem [BACKEND_SETUP.md](BACKEND_SETUP.md) để cấu hình backend

## Base URL
```
https://100.70.202.103:7085/api
```

## Đã triển khai

### 1. Authentication API

#### Login
- **Endpoint:** `POST /auth/login`
- **Request Body:**
  ```json
  {
    "username": "Admin",
    "password": "Admin@123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful.",
    "username": "Admin"
  }
  ```
- **Sử dụng trong:** `src/pages/Login/Login.jsx`

#### Logout
- **Endpoint:** `POST /auth/logout`
- **Sử dụng trong:** `src/pages/AdminPage/Main.jsx`, `src/pages/UserPage/UserPage.jsx`

### 2. User Profile API

#### Get Profile
- **Endpoint:** `GET /user/profile`
- **Headers:** `Authorization: Bearer {token}`
- **Response:** User profile data
- **Sử dụng trong:** `src/pages/AdminPage/ManageProfile.jsx`

#### Update Profile
- **Endpoint:** `PUT /user/profile`
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:**
  ```json
  {
    "firstName": "Hưng",
    "lastName": "Phạm",
    "birthDate": "2003-09-13",
    "gender": "Nam",
    "email": "hungpham@gmail.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "userName": "hung.pq"
  }
  ```
- **Sử dụng trong:** `src/pages/AdminPage/ManageProfile.jsx`

### 3. Attendance API

#### Get All Attendance Records
- **Endpoint:** `GET /attendance`
- **Headers:** `Authorization: Bearer {token}`

#### Create Attendance Record
- **Endpoint:** `POST /attendance`
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:** Attendance data

#### Update Attendance Record
- **Endpoint:** `PUT /attendance/{id}`
- **Headers:** `Authorization: Bearer {token}`
- **Request Body:** Updated attendance data

#### Delete Attendance Record
- **Endpoint:** `DELETE /attendance/{id}`
- **Headers:** `Authorization: Bearer {token}`

#### Get Statistics
- **Endpoint:** `GET /attendance/statistics`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "totalAttendance": 100,
    "presentToday": 45,
    "absentToday": 5,
    "attendanceRate": 90
  }
  ```
- **Sử dụng trong:** `src/pages/UserPage/UserPage.jsx`

## Cách sử dụng

### Import API service
```javascript
import { authAPI, userAPI, attendanceAPI } from '../services/api';
```

### Gọi API
```javascript
// Login
const response = await authAPI.login(username, password);

// Get Profile
const profile = await userAPI.getProfile();

// Update Profile
await userAPI.updateProfile(profileData);

// Get Statistics
const stats = await attendanceAPI.getStatistics();
```

## Lưu ý

### ⚠️ QUAN TRỌNG: Cấu hình CORS Backend

Backend **BẮT BUỘC** phải cấu hình CORS để chấp nhận requests từ frontend HTTPS.

**Cấu hình CORS trong ASP.NET Core (Program.cs hoặc Startup.cs):**

```csharp
// Thêm CORS service TRƯỚC builder.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "https://localhost:5173", 
                "https://localhost:5174", 
                "https://localhost:5175",
                "https://100.116.243.26:5173",  // Frontend trên network
                "https://100.116.243.26:5174"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Sau builder.Build() và TRƯỚC các endpoint middleware
var app = builder.Build();

// QUAN TRỌNG: UseCors phải đứng TRƯỚC UseAuthorization
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();
```

**Kiểm tra CORS đã hoạt động:**
Open browser DevTools → Network → Gửi request → Check Response Headers phải có:
- `Access-Control-Allow-Origin: https://localhost:5173`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: *`

1. **HTTPS Certificate**: Vì backend sử dụng HTTPS với IP 100.70.202.103, bạn có thể cần:
   - Cấu hình certificate trong backend
   - Hoặc thêm exception cho self-signed certificate trong browser
   - Truy cập `https://100.70.202.103:7085/api` trực tiếp trong browser và chấp nhận certificate

2. **CORS**: Xem hướng dẫn cấu hình CORS ở trên ⬆️

3. **Token Management**: 
   - Token được lưu trong localStorage
   - Tự động thêm vào header của mỗi request thông qua axios interceptor
   - Token được xóa khi logout

4. **Error Handling**: Tất cả API calls đều có try-catch để xử lý lỗi

## Development Setup

### Cài đặt dependencies
```bash
npm install axios
npm install @vitejs/plugin-basic-ssl --save-dev
```

### Chạy ứng dụng với HTTPS
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `https://localhost:5173`

**Lưu ý:** Trình duyệt có thể cảnh báo về certificate tự ký (self-signed). Đây là bình thường trong development. Nhấn "Advanced" và "Proceed to localhost" để tiếp tục.

## API Service Structure

```
src/
  services/
    api.js          # Main API configuration và endpoints
  pages/
    Login/
      Login.jsx     # Sử dụng authAPI.login()
    AdminPage/
      Main.jsx      # Xử lý logout
      ManageProfile.jsx  # Sử dụng userAPI
    UserPage/
      UserPage.jsx  # Sử dụng attendanceAPI.getStatistics()
```

## Tiếp theo cần làm

- [ ] Triển khai các API endpoint còn lại trong backend
- [ ] Thêm token vào response của login API
- [ ] Implement refresh token mechanism
- [ ] Thêm loading indicators cho tất cả API calls
- [ ] Implement error handling UI (toast notifications)
- [ ] Thêm form validation trước khi gọi API
- [ ] Implement attendance management UI với CRUD operations

---

## 🔧 Troubleshooting

### Lỗi CORS: "No 'Access-Control-Allow-Origin' header"

**Triệu chứng:**
```
Access to XMLHttpRequest at 'https://100.70.202.103:7085/api/auth/login' 
from origin 'https://localhost:5173' has been blocked by CORS policy
```

**Nguyên nhân:** Backend chưa cấu hình CORS hoặc cấu hình sai

**Giải pháp:**

1. **Kiểm tra backend có chạy không:**
   - Mở browser, truy cập: `https://100.70.202.103:7085/api`
   - Nếu hiển thị trang hoặc JSON → backend đang chạy
   - Nếu không kết nối được → kiểm tra backend service

2. **Cấu hình CORS trong backend:**
   
   **ASP.NET Core - Program.cs:**
   ```csharp
   var builder = WebApplication.CreateBuilder(args);
   
   // Thêm CORS service
   builder.Services.AddCors(options =>
   {
       options.AddPolicy("AllowFrontend", policy =>
       {
           policy.WithOrigins(
                   "https://localhost:5173",
                   "https://localhost:5174",
                   "https://localhost:5175",
                   "https://100.116.243.26:5173",
                   "https://100.116.243.26:5174"
                 )
                 .AllowAnyHeader()
                 .AllowAnyMethod()
                 .AllowCredentials();
       });
   });
   
   builder.Services.AddControllers();
   
   var app = builder.Build();
   
   // QUAN TRỌNG: Thứ tự middleware
   app.UseHttpsRedirection();
   app.UseCors("AllowFrontend");  // ← Phải đứng TRƯỚC UseAuthorization
   app.UseAuthorization();
   app.MapControllers();
   
   app.Run();
   ```

3. **Kiểm tra CORS đã hoạt động:**
   - Mở DevTools (F12) → Tab Network
   - Thử login
   - Click vào request `login`
   - Tab Headers → Response Headers phải có:
     ```
     Access-Control-Allow-Origin: https://localhost:5173
     Access-Control-Allow-Credentials: true
     ```

4. **Nếu vẫn lỗi:**
   - Xóa cache browser (Ctrl+Shift+Delete)
   - Hard refresh (Ctrl+F5)
   - Thử browser khác (Chrome/Edge)
   - Restart backend server sau khi thay đổi code

### Lỗi SSL Certificate

**Triệu chứng:**
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**Giải pháp:**
1. Truy cập trực tiếp backend URL trong browser: `https://100.70.202.103:7085`
2. Click "Advanced" → "Proceed to 100.70.202.103 (unsafe)"
3. Làm tương tự cho frontend: `https://localhost:5173`
4. Refresh lại trang và thử login

### Lỗi Network/Connection Refused

**Kiểm tra:**
- Backend có đang chạy không?
- IP address `100.70.202.103` có đúng không?
- Port `7085` có mở không?
- Firewall có block kết nối không?

**Test kết nối:**
```powershell
# Windows PowerShell
Test-NetConnection -ComputerName 100.70.202.103 -Port 7085
```

### Request timeout/không có response

**Kiểm tra:**
- Backend controller có implement đúng endpoint không
- Có log lỗi trong backend console không
- Response có đúng format JSON không
- Token authentication có đang block request không (với endpoints ko phải login)
