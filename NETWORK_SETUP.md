# Chạy Frontend trên Network IP

## Cấu hình hiện tại

Frontend đã được cấu hình để chạy trên network, cho phép truy cập từ các máy khác trong mạng.

### IP hiện tại: `100.116.243.26`

---

## Khởi động ứng dụng

```bash
npm run dev
```

Sau khi chạy, Vite sẽ hiển thị:

```
VITE v7.3.1  ready in XXX ms

➜  Local:   https://localhost:5173/
➜  Network: https://100.116.243.26:5173/
```

---

## Truy cập ứng dụng

### Từ máy localhost:
```
https://localhost:5173
```

### Từ máy khác trong mạng:
```
https://100.116.243.26:5173
```

**Lưu ý:** Khi truy cập lần đầu, browser sẽ cảnh báo về self-signed certificate:
1. Click "Advanced" hoặc "Chi tiết"
2. Click "Proceed to 100.116.243.26 (unsafe)" hoặc "Tiếp tục"
3. Đây là bình thường trong development

---

## ⚠️ Backend CORS Configuration

Backend **BẮT BUỘC** phải cấu hình CORS để chấp nhận requests từ IP này.

### Thêm vào `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "https://localhost:5173",
                "https://localhost:5174", 
                "https://localhost:5175",
                "https://100.116.243.26:5173",  // ← QUAN TRỌNG
                "https://100.116.243.26:5174"   // ← QUAN TRỌNG
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Middleware
app.UseCors("AllowFrontend");
```

---

## Thay đổi IP

Nếu IP máy thay đổi, cần:

### 1. Kiểm tra IP hiện tại

**Windows PowerShell:**
```powershell
# Lấy IPv4 address
Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4" -and $_.IPAddress -notlike "127.*"} | Select-Object IPAddress, InterfaceAlias
```

**Hoặc đơn giản:**
```powershell
ipconfig
```

Tìm dòng `IPv4 Address` trong phần network adapter bạn đang sử dụng.

### 2. KHÔNG cần thay đổi `vite.config.js`

File `vite.config.js` đã cấu hình `host: '0.0.0.0'` để tự động expose tất cả network interfaces. Vite sẽ tự động phát hiện IP của máy.

### 3. CẦN cập nhật Backend CORS

Thêm IP mới vào danh sách origins trong backend `Program.cs`:

```csharp
policy.WithOrigins(
    "https://localhost:5173",
    "https://localhost:5174", 
    "https://100.116.243.26:5173",  // IP cũ
    "https://YOUR_NEW_IP:5173"      // ← IP mới
)
```

### 4. Restart cả Frontend và Backend

```bash
# Stop và restart frontend
npm run dev

# Restart backend
dotnet run
```

---

## Firewall Configuration

Nếu không truy cập được từ máy khác, check firewall:

### Windows Firewall

**PowerShell (Run as Administrator):**
```powershell
# Cho phép port 5173
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

**Hoặc qua GUI:**
1. Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → 5173
4. Allow the connection → Next → Finish

---

## Troubleshooting

### ❌ Không kết nối được từ máy khác

**Checklist:**
- [ ] Frontend đang chạy (`npm run dev`)
- [ ] IP `100.116.243.26` là IP đúng của máy (check bằng `ipconfig`)
- [ ] Firewall đã cho phép port 5173
- [ ] Các máy trong cùng mạng (cùng subnet)
- [ ] Backend CORS đã include IP này

**Test kết nối:**
```powershell
# Từ máy khác, test kết nối
Test-NetConnection -ComputerName 100.116.243.26 -Port 5173
```

### ❌ CORS error từ network IP

**Triệu chứng:**
```
Access to XMLHttpRequest at 'https://100.70.202.103:7085/api/auth/login' 
from origin 'https://100.116.243.26:5173' has been blocked by CORS policy
```

**Fix:** Backend chưa có origin này. Thêm vào CORS config:
```csharp
policy.WithOrigins(
    // ... origins khác
    "https://100.116.243.26:5173"
)
```

### ❌ SSL Certificate Error

Khi truy cập từ máy khác:
1. Truy cập `https://100.116.243.26:5173`
2. Browser hiện cảnh báo certificate
3. Click "Advanced" → "Proceed to 100.116.243.26"
4. Chấp nhận risk (chỉ trong development)

---

## Production Deployment

Trong production, **KHÔNG** nên dùng self-signed certificate và expose IP trực tiếp:

1. ✅ Sử dụng domain name (ví dụ: `https://app.example.com`)
2. ✅ Cài đặt proper SSL certificate (Let's Encrypt, Cloudflare, etc.)
3. ✅ Configure reverse proxy (Nginx, IIS)
4. ✅ Restrict CORS đến specific production domains

---

## Tài liệu liên quan

- [README.md](README.md) - Hướng dẫn chung
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Cấu hình CORS backend
- [API_INTEGRATION.md](API_INTEGRATION.md) - API documentation
