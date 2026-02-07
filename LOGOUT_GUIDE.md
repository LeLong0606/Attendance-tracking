# Logout Flow & Cookie Clearing Guide

## Tổng quan Logout Process

Khi người dùng click "Đăng xuất", ứng dụng sẽ:

1. **Gọi Backend API logout** → Backend xóa session/token
2. **Clear localStorage** → Xóa access token
3. **Clear cookies** → Xóa refresh token
4. **Redirect to login** → Quay về trang login

---

## Implementation

### Main.jsx (Admin Page)

```javascript
import { authAPI, cookieManager } from '../../services/api';

const handleLogout = async () => {
  try {
    // 1. Gọi backend logout API trước
    await authAPI.logout();
  } catch (error) {
    console.error('Logout API error:', error);
    // Vẫn tiếp tục logout local even nếu API error
  } finally {
    // 2. Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // 3. Clear cookies
    cookieManager.deleteCookie('X-Refresh-Token');
    
    // Debug log
    console.log('✅ Logout thành công!');
    console.log('🗑️  Cleared localStorage:', { user: null, token: null });
    console.log('🍪 Deleted cookie: X-Refresh-Token');
    
    // 4. Redirect to login
    navigate('/');
  }
};
```

### UserPage.jsx (User Page)

Cùng logic logout như Admin page.

---

## Logout Flow Chi tiết

### Trước Logout

**localStorage:**
```javascript
{
  user: "Admin",
  token: "eyJhbGciOiJIUzI1NiI..."
}
```

**cookies:**
```javascript
{
  "X-Refresh-Token": "eyJhbGciOiJIUzI1NiI..."
}
```

**Headers tự động trong request:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiI...
X-Refresh-Token: eyJhbGciOiJIUzI1NiI...
```

### Trong Logout

1. **Call API:**
   ```javascript
   await authAPI.logout();
   ```
   Backend sẽ xóa session/revoke token

2. **Clear Storage:**
   ```javascript
   localStorage.removeItem('user');
   localStorage.removeItem('token');
   ```

3. **Delete Cookie:**
   ```javascript
   cookieManager.deleteCookie('X-Refresh-Token');
   ```

### Sau Logout

**localStorage:** (Trống)
```javascript
{}
```

**cookies:** (Trống)
```javascript
{}
```

**Headers:**
```
Authorization: (không có)
X-Refresh-Token: (không có)
```

**Kết quả:**
- User redirect to `/` (login page)
- Tất cả API calls sẽ bị 401 Unauthorized vì không có token
- Protected routes redirect to login

---

## Backend Logout API

### Request
```
POST /api/auth/logout
Headers:
- Authorization: Bearer {token}
- X-Refresh-Token: {refresh_token}
```

### Response
```json
{
  "message": "Logout successful."
}
```

### ASP.NET Core Implementation

```csharp
[HttpPost("logout")]
[Authorize]  // Kiểm tra JWT token
public IActionResult Logout()
{
    try
    {
        // Lấy token từ header
        var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        
        // Optional: Invalidate token (thêm vào blacklist hoặc database)
        // await _tokenService.InvalidateToken(token);
        
        // Xóa refresh token cookie
        Response.Cookies.Delete("X-Refresh-Token");
        
        return Ok(new { message = "Logout successful." });
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = "Logout failed: " + ex.Message });
    }
}
```

---

## Error Handling trong Logout

### Scenario 1: API Error nhưng vẫn clear local

```javascript
const handleLogout = async () => {
  try {
    await authAPI.logout();  // Có thể fail
  } catch (error) {
    console.error('Logout API error:', error);
    // VẪN TIẾP TỤC CLEAR LOCAL
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    cookieManager.deleteCookie('X-Refresh-Token');
    navigate('/');
  }
};
```

**Lợi ích:** User sẽ được logout ngay cả khi backend fail

### Scenario 2: Network Error

Nếu không có kết nối internet:
- `authAPI.logout()` sẽ fail
- Catch block sẽ log error
- Finally block vẫn xóa local storage
- User redirect to login

### Scenario 3: Token đã expired

Nếu token đã hết hạn:
- Backend có thể trả về 401
- `authAPI.logout()` throw error
- Catch block xử lý
- Finally block clear everything
- User redirect to login

---

## Cookie Clearing

### Cách 1: Dùng cookieManager Utility

```javascript
import { cookieManager } from '../../services/api';

// Xóa một cookie
cookieManager.deleteCookie('X-Refresh-Token');

// Xóa tất cả cookies (loop)
const allCookies = cookieManager.getAllCookies();
Object.keys(allCookies).forEach(cookieName => {
  cookieManager.deleteCookie(cookieName);
});
```

### Cách 2: Direct JavaScript

```javascript
// Xóa một cookie
document.cookie = "X-Refresh-Token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
```

### Cách 3: Backend Delete

Nếu backend set `HttpOnly = true`, chỉ backend có thể xóa:

```csharp
Response.Cookies.Delete("X-Refresh-Token");
```

---

## Testing Logout Flow

### Checklist

- [ ] Login thành công
  - localStorage có `token` và `user`
  - Cookie có `X-Refresh-Token`
  
- [ ] Click logout
  - API `/api/auth/logout` gọi thành công (200 OK)
  - localStorage trống
  - Cookie xóa
  - Console hiển thị debug logs
  
- [ ] Redirect to login
  - URL thay đổi thành `/`
  - Login form hiển thị
  
- [ ] Thử truy cập protected route
  - Redirect to login (vì không có token)

### DevTools Check

1. **Before Logout:**
   - Application → Storage → localStorage → `token` có
   - Application → Cookies → `X-Refresh-Token` có
   - Network → Request headers → có `Authorization`, `X-Refresh-Token`

2. **After Logout:**
   - Application → localStorage → trống
   - Application → Cookies → `X-Refresh-Token` không có
   - Network → Request headers → không có `Authorization`, `X-Refresh-Token`

---

## Security Considerations

1. ✅ **Call API trước** - Đảm bảo backend xóa session
2. ✅ **Clear tokens sau** - Xóa local storage & cookies
3. ✅ **Try-finally** - Chắc chắn clear even khi API fail
4. ✅ **Redirect to public page** - Không redirect to protected route
5. ✅ **Backend validation** - Check authorization header trước khi logout
6. ✅ **HTTPS only** - Secure cookie flag
7. ✅ **HttpOnly cookie** - JavaScript không thể access refresh token

---

## Troubleshooting

### ❌ Logout nhưng vẫn thấy token trong DevTools

**Kiểm tra:**
- [ ] `localStorage.removeItem()` có được gọi?
- [ ] `cookieManager.deleteCookie()` có được gọi?
- [ ] Page đã refresh?
- [ ] DevTools cache cần clear?

**Fix:**
```javascript
// Force refresh
window.location.href = '/';  // thay vì navigate('/')
```

### ❌ API logout error nhưng vẫn logout local

**Đây là bình thường!** Using `try-finally` đảm bảo local logout dù API fail.

**Check console:**
```javascript
console.error('Logout API error:', error);
```

### ❌ Cookie X-Refresh-Token vẫn còn

**Kiểm tra:**
- [ ] `cookieManager.deleteCookie('X-Refresh-Token')` có gọi?
- [ ] Backend set `HttpOnly = true`?
  - Nếu có → Chỉ backend mới delete, JS không thể
  - Fix: Call `authAPI.logout()` để backend delete

**Backend verify:**
```csharp
// Check cookie đã xóa?
if (Request.Cookies.ContainsKey("X-Refresh-Token"))
{
    Response.Cookies.Delete("X-Refresh-Token");
}
```

### ❌ Logout nhưng API call vẫn có Authorization

**Nguyên nhân:** Race condition - request send trước khi token clear

**Fix:**
```javascript
const handleLogout = async () => {
  // First: Clear tokens (prevent new requests)
  localStorage.removeItem('token');
  cookieManager.deleteCookie('X-Refresh-Token');
  
  // Then: Call logout API
  try {
    await authAPI.logout();
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Finally: Redirect
  navigate('/');
};
```

---

## Browser Console Output

**Successful Logout:**
```
✅ Logout thành công!
🗑️  Cleared localStorage: { user: null, token: null }
🍪 Deleted cookie: X-Refresh-Token
```

**With Error:**
```
Logout API error: Error: Network Error
✅ Logout thành công!
🗑️  Cleared localStorage: { user: null, token: null }
🍪 Deleted cookie: X-Refresh-Token
```

---

## Files Modified

- [src/pages/AdminPage/Main.jsx](src/pages/AdminPage/Main.jsx) - Logout implementation
- [src/pages/UserPage/UserPage.jsx](src/pages/UserPage/UserPage.jsx) - Logout implementation
- [src/services/api.js](src/services/api.js) - Cookie manager utility

---

## Related Documentation

- [COOKIE_TOKEN_MANAGEMENT.md](COOKIE_TOKEN_MANAGEMENT.md) - Token management
- [API_INTEGRATION.md](API_INTEGRATION.md) - API integration
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Backend configuration
