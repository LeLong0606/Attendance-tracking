# Backend Setup Guide - CORS Configuration

## ⚠️ LỖI CORS - HƯỚNG DẪN SỬA NHANH

Nếu bạn thấy lỗi này trong browser console:
```
Access to XMLHttpRequest at 'https://100.70.202.103:7085/api/auth/login' 
from origin 'https://localhost:5173' has been blocked by CORS policy
```

Backend cần cấu hình CORS ngay lập tức.

---

## ASP.NET Core - Cấu hình CORS

### File: `Program.cs`

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// ============ THÊM CORS SERVICE ============
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
              .AllowCredentials();  // Quan trọng nếu dùng cookies/auth
    });
});
// ==========================================

builder.Services.AddControllers();
// Thêm các services khác...

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();

// ============ SỬ DỤNG CORS MIDDLEWARE ============
// QUAN TRỌNG: Phải đặt TRƯỚC UseAuthorization()
app.UseCors("AllowFrontend");
// =================================================

app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## Thứ tự Middleware QUAN TRỌNG

```csharp
var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");      // ← 1. CORS đầu tiên
app.UseAuthentication();            // ← 2. Authentication
app.UseAuthorization();             // ← 3. Authorization
app.MapControllers();
```

**Nếu sai thứ tự → CORS sẽ KHÔNG hoạt động!**

---

## Kiểm tra CORS đã hoạt động

### 1. Restart Backend
```bash
# Stop backend và chạy lại
dotnet run
```

### 2. Test trong Browser
1. Mở DevTools (F12)
2. Tab Network
3. Từ frontend, thử login
4. Click vào request `login` 
5. Tab **Headers** → **Response Headers** phải có:
   ```
   Access-Control-Allow-Origin: https://localhost:5173
   Access-Control-Allow-Credentials: true
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: content-type, authorization
   ```

### 3. Test Preflight Request
Nếu có request OPTIONS (preflight), check:
- Status: `200 OK` hoặc `204 No Content`
- Response Headers phải có các header CORS

---

## Development vs Production

### Development (cho phép nhiều origins)
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

⚠️ **KHÔNG dùng AllowAnyOrigin trong Production!**

### Production (chỉ cho phép specific origins)
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionPolicy", policy =>
    {
        policy.WithOrigins("https://yourdomain.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

---

## Controller Configuration

Nếu muốn enable CORS cho từng controller:

```csharp
using Microsoft.AspNetCore.Cors;

[ApiController]
[Route("api/[controller]")]
[EnableCors("AllowFrontend")]  // ← Enable CORS cho controller này
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        // Login logic
        return Ok(new { message = "Login successful.", username = request.Username });
    }
}
```

---

## Troubleshooting

### ❌ Vẫn lỗi CORS sau khi config

**Checklist:**
- [ ] Đã thêm `builder.Services.AddCors()`?
- [ ] Đã gọi `app.UseCors()` TRƯỚC `app.UseAuthorization()`?
- [ ] Origin trong config có đúng với frontend URL không?
- [ ] Đã restart backend sau khi thay đổi code?
- [ ] Browser cache đã xóa chưa? (Ctrl+Shift+Delete)

### ❌ Lỗi: Policy not found

```
No policy found: AllowFrontend
```

**Nguyên nhân:** Tên policy trong `AddCors()` khác với `UseCors()`

**Fix:** Đảm bảo tên giống nhau:
```csharp
// Phải giống nhau ↓
builder.Services.AddCors(options => options.AddPolicy("AllowFrontend", ...));
app.UseCors("AllowFrontend");
//            ↑ Tên này phải giống
```

### ❌ Preflight request failed

**Triệu chứng:** Browser gửi OPTIONS request nhưng bị 404 hoặc 500

**Fix:** Đảm bảo middleware CORS đứng đúng vị trí:
```csharp
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");  // ← Phải ở đây
app.UseRouting();
app.UseAuthorization();
app.MapControllers();
```

---

## Contact Frontend Team

- Frontend URL: `https://localhost:5173` (hoặc 5174, 5175...)
- Backend URL: `https://100.70.202.103:7085/api`
- Cần allow credentials: **YES**
- Cần allow methods: **GET, POST, PUT, DELETE, OPTIONS**

Nếu cần thay đổi origin, báo team frontend để cập nhật API service.

---

## Tài liệu tham khảo

- [Microsoft CORS Documentation](https://learn.microsoft.com/en-us/aspnet/core/security/cors)
- Frontend API Integration: `API_INTEGRATION.md`
