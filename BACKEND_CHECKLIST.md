# Backend Checklist - Cần làm gì để Frontend hoạt động

## ✅ Checklist cho Backend Developer

### 1. CORS Configuration (BẮT BUỘC)
- [ ] Thêm CORS service trong `Program.cs`:
  ```csharp
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
  ```
- [ ] Thêm middleware CORS (TRƯỚC UseAuthorization):
  ```csharp
  app.UseCors("AllowFrontend");
  ```
- [ ] Restart backend server

### 2. Kiểm tra Backend đang chạy
- [ ] URL: `https://100.70.202.103:7085`
- [ ] Port 7085 đã mở
- [ ] HTTPS certificate đã cấu hình
- [ ] Có thể truy cập từ browser

### 3. API Endpoints cần implement

#### Authentication
- [ ] `POST /api/auth/login`
  - Request: `{ "username": "Admin", "password": "Admin@123" }`
  - Response: `{ "message": "Login successful.", "username": "Admin", "token": "..." }`
  
- [ ] `POST /api/auth/logout`
  - Không yêu cầu request body
  - Response: `{ "message": "Logout successful." }`

#### User Profile (cần Authorization Bearer token)
- [ ] `GET /api/user/profile`
  - Headers: `Authorization: Bearer {token}`
  - Response: User profile data
  
- [ ] `PUT /api/user/profile`
  - Headers: `Authorization: Bearer {token}`
  - Request: Profile update data
  - Response: Updated profile

#### Attendance (cần Authorization Bearer token)
- [ ] `GET /api/attendance/statistics`
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ "totalAttendance": 100, "presentToday": 45, "absentToday": 5, "attendanceRate": 90 }`

- [ ] `GET /api/attendance`
  - Headers: `Authorization: Bearer {token}`
  - Response: List of attendance records

- [ ] `POST /api/attendance`
  - Headers: `Authorization: Bearer {token}`
  - Request: Attendance data
  - Response: Created record

- [ ] `PUT /api/attendance/{id}`
  - Headers: `Authorization: Bearer {token}`
  - Request: Updated data
  - Response: Updated record

- [ ] `DELETE /api/attendance/{id}`
  - Headers: `Authorization: Bearer {token}`
  - Response: Success message

### 4. Test CORS hoạt động
- [ ] Mở DevTools trong browser
- [ ] Từ frontend (https://localhost:5173), thử login
- [ ] Check Response Headers có:
  - `Access-Control-Allow-Origin: https://localhost:5173`
  - `Access-Control-Allow-Credentials: true`

### 5. Test từng Endpoint

#### Test Login
```bash
curl -X POST https://100.70.202.103:7085/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin","password":"Admin@123"}'
```
Expected response:
```json
{
  "message": "Login successful.",
  "username": "Admin",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Test Statistics
```bash
curl https://100.70.202.103:7085/api/attendance/statistics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
Expected response:
```json
{
  "totalAttendance": 100,
  "presentToday": 45,
  "absentToday": 5,
  "attendanceRate": 90
}
```

### 6. Logging & Error Handling
- [ ] Log tất cả incoming requests
- [ ] Log CORS preflight requests (OPTIONS)
- [ ] Return proper HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 404: Not Found
  - 500: Internal Server Error

### 7. Security
- [ ] Validate username/password
- [ ] Generate JWT token on login
- [ ] Verify JWT token on protected endpoints
- [ ] Hash passwords (KHÔNG lưu plain text)
- [ ] HTTPS enabled (SSL certificate)

---

## 🚨 Nếu Frontend báo lỗi CORS

1. **Double check CORS config**
   - `AddCors()` đã gọi chưa?
   - `UseCors()` đứng TRƯỚC `UseAuthorization()` chưa?
   - Origin có đúng không?

2. **Restart backend**
   ```bash
   dotnet run
   ```

3. **Check Response Headers**
   - Open DevTools → Network → Click request → Headers tab
   - Response Headers phải có `Access-Control-Allow-Origin`

4. **Chi tiết**: Xem [BACKEND_SETUP.md](BACKEND_SETUP.md)

---

## 📞 Liên hệ Frontend Team

Nếu cần thay đổi:
- API URL
- Request/Response format
- Authentication method
- CORS origins

→ Thông báo Frontend team để cập nhật API service

---

## 📚 Tài liệu

- **Backend Setup**: [BACKEND_SETUP.md](BACKEND_SETUP.md)
- **API Documentation**: [API_INTEGRATION.md](API_INTEGRATION.md)
- **Frontend README**: [README.md](README.md)
