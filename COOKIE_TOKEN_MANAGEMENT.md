# Cookie & Token Management Guide

## Tổng quan

Ứng dụng quản lý hai loại token:

1. **Access Token** (localStorage)
   - Lưu trong: `localStorage['token']`
   - Gửi trong: `Authorization: Bearer {token}` header

2. **Refresh Token** (cookie)
   - Lưu trong: Cookie `X-Refresh-Token`
   - Gửi trong: `X-Refresh-Token` header

---

## API Service - Tự động gửi Tokens

File [src/services/api.js](src/services/api.js) đã cấu hình tự động gửi cả hai token trong mỗi request:

### Request Headers tự động thêm:

```
Authorization: Bearer {access_token_from_localStorage}
X-Refresh-Token: {refresh_token_from_cookie}
Content-Type: application/json
```

### Ví dụ - Các request sẽ có:

```javascript
// Login call
POST /api/auth/login
Headers:
- X-Refresh-Token: eyJhbGciOiJIUzI1NiI... (từ cookie)

// Get profile (sau khi login)
GET /api/user/profile
Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiI... (từ localStorage)
- X-Refresh-Token: eyJhbGciOiJIUzI1NiI... (từ cookie)
```

---

## Sử dụng trong Components

### 1. Lấy cookie từ một component

```javascript
import { cookieManager } from '../services/api';

// Lấy một cookie cụ thể
const refreshToken = cookieManager.getCookie('X-Refresh-Token');
console.log('Refresh Token:', refreshToken);

// Lấy tất cả cookies
const allCookies = cookieManager.getAllCookies();
console.log('All Cookies:', allCookies);
```

### 2. Set cookie

```javascript
import { cookieManager } from '../services/api';

// Set cookie mới (mặc định 7 ngày)
cookieManager.setCookie('X-Refresh-Token', 'token_value');

// Set cookie với số ngày custom
cookieManager.setCookie('X-Custom-Token', 'value', 30); // 30 ngày
```

### 3. Xóa cookie

```javascript
import { cookieManager } from '../services/api';

// Xóa cookie
cookieManager.deleteCookie('X-Refresh-Token');
```

---

## Backend Response - Cách Backend Set Cookie

Backend có thể set cookie bằng response header:

```csharp
// ASP.NET Core
HttpContext.Response.Cookies.Append(
    "X-Refresh-Token",
    refreshToken,
    new CookieOptions
    {
        HttpOnly = true,     // Không cho JavaScript access (bảo mật)
        Secure = true,       // Chỉ gửi qua HTTPS
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.UtcNow.AddDays(7)
    }
);
```

**Lưu ý:** Nếu backend set `HttpOnly = true`, JavaScript KHÔNG thể đọc cookie đó. Trong trường hợp này, browser sẽ tự động gửi cookie, nhưng bạn không thể truy cập giá trị bằng `cookieManager.getCookie()`.

---

## Backend - Login Response

Backend login API nên trả về:

```json
{
  "message": "Login successful.",
  "username": "Admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Hoặc set refresh token trong cookie header.

### ASP.NET Core Login Implementation

```csharp
[HttpPost("login")]
public IActionResult Login([FromBody] LoginRequest request)
{
    if (request.Username == "Admin" && request.Password == "Admin@123")
    {
        var accessToken = GenerateJwtToken(request.Username);
        var refreshToken = GenerateRefreshToken();
        
        // Set refresh token in cookie
        HttpContext.Response.Cookies.Append(
            "X-Refresh-Token",
            refreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            }
        );
        
        return Ok(new
        {
            message = "Login successful.",
            username = request.Username,
            token = accessToken,
            refreshToken = refreshToken  // Optional: cũng return trong body
        });
    }
    
    return Unauthorized(new { message = "Invalid credentials" });
}
```

---

## Logout - Clear Tokens

### Frontend Logout (Login.jsx hoặc Main.jsx)

```javascript
import { authAPI, cookieManager } from '../../services/api';

const handleLogout = async () => {
  try {
    // Call backend logout API
    await authAPI.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear cookie (frontend side)
    // Note: Nếu backend set HttpOnly, chỉ backend mới có thể xóa
    cookieManager.deleteCookie('X-Refresh-Token');
    
    // Redirect to login
    navigate('/');
  }
};
```

### Backend Logout

```csharp
[HttpPost("logout")]
public IActionResult Logout()
{
    // Xóa refresh token cookie
    HttpContext.Response.Cookies.Delete("X-Refresh-Token");
    
    return Ok(new { message = "Logout successful." });
}
```

---

## Token Refresh Flow

### Khi Access Token Hết Hạn

1. **Backend** trả về `401 Unauthorized`
2. **Axios interceptor** (có thể thêm) sẽ:
   - Lấy access token mới từ refresh token
   - Retry request cũ
   - Hoặc redirect to login nếu refresh fail

### Response Interceptor Example

```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getCookie('X-Refresh-Token');
        if (!refreshToken) {
          // Redirect to login
          window.location.href = '/';
          return Promise.reject(error);
        }
        
        // Call refresh token API
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });
        
        // Save new access token
        localStorage.setItem('token', response.data.token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        return api(originalRequest);
      } catch (err) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/';
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## Troubleshooting

### ❌ X-Refresh-Token không có trong request

**Kiểm tra:**
- [ ] Cookie `X-Refresh-Token` có được set lúc login không?
- [ ] Backend có trả về cookie trong response không?
- [ ] Browser DevTools → Application → Cookies → có cookie này không?

**Fix:**
```javascript
// Debug: lấy tất cả cookies
const cookies = cookieManager.getAllCookies();
console.log('Cookies:', cookies);
```

### ❌ CORS error khi gửi cookie

**Lỗi:**
```
Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy: 
The value of the 'Access-Control-Allow-Credentials' header in the response is '' which 
must be 'true' when the request's credentials mode (include) is 'credentials'.
```

**Fix - Backend CORS config:**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://localhost:5173", "https://100.116.243.26:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()  // ← QUAN TRỌNG cho cookies
              ;
    });
});
```

### ❌ Backend set HttpOnly cookie nhưng JavaScript không thể read

**Này là bình thường!**
- `HttpOnly = true` → Cookie an toàn, chỉ backend và browser có thể access
- JavaScript `cookieManager.getCookie()` sẽ return `null`
- Nhưng browser vẫn sẽ tự động gửi cookie trong request (vì `withCredentials: true`)

**Kiểm tra trong DevTools:**
1. DevTools → Network → click request
2. Tab "Request Headers" → có `Cookie: X-Refresh-Token=...` không?
3. Nếu có → cookies được gửi đi bình thường

---

## Security Best Practices

1. ✅ **Access Token** → Lưu trong localStorage (ngắn hạn, ~15 phút)
2. ✅ **Refresh Token** → Lưu trong HttpOnly cookie (dài hạn, ~7 ngày)
3. ✅ CORS `AllowCredentials: true` để gửi cookies
4. ✅ HTTPS cho cả frontend và backend
5. ✅ Set `Secure` và `SameSite` trên cookies
6. ✅ Validate tokens ở backend

---

## File Sources

- **API Service:** [src/services/api.js](src/services/api.js)
- **Login Component:** [src/pages/Login/Login.jsx](src/pages/Login/Login.jsx)
- **Main Component:** [src/pages/AdminPage/Main.jsx](src/pages/AdminPage/Main.jsx)
- **Backend CORS Setup:** [BACKEND_SETUP.md](BACKEND_SETUP.md)

---

## Tài liệu

- [MDN - HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN - Authorization Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization)
- [JWT.io](https://jwt.io/)
- [Axios Instance](https://axios-http.com/docs/instance)
