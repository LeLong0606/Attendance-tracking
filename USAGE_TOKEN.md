# Hướng dẫn sử dụng Access Token

## Import functions

```javascript
import { getUserFromToken, hasPermission, decodeToken } from './services/api';
```

## 1. Lấy thông tin user từ Access Token

```javascript
const user = getUserFromToken();

if (user) {
  console.log('User ID:', user.id);           // sub field
  console.log('Username:', user.username);     // unique_name field
  console.log('Email:', user.email);           // email field
  console.log('Permissions:', user.permissions); // permissions array
  console.log('Token expires at:', new Date(user.exp * 1000));
}
```

## 2. Kiểm tra quyền của user

```javascript
// Kiểm tra một quyền cụ thể
if (hasPermission('SYSTEM_USERS.Read')) {
  // User có quyền đọc danh sách users
  console.log('Có quyền xem users');
}

// Kiểm tra nhiều quyền
const user = getUserFromToken();
const canManageUsers = user?.permissions?.includes('SYSTEM_USERS.Write');
const canDeleteUsers = user?.permissions?.includes('SYSTEM_USERS.Delete');
```

## 3. Sử dụng trong Component

```javascript
import { useEffect, useState } from 'react';
import { getUserFromToken } from '../../services/api';

function MyComponent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = getUserFromToken();
    if (userInfo) {
      setUser(userInfo);
    }
  }, []);

  return (
    <div>
      <h1>Xin chào, {user?.username}!</h1>
      <p>Email: {user?.email}</p>
      
      {user?.permissions?.includes('SYSTEM_USERS.Write') && (
        <button>Tạo người dùng mới</button>
      )}
    </div>
  );
}
```

## 4. Decode token thủ công

```javascript
const token = localStorage.getItem('token');
const decoded = decodeToken(token);

console.log('Full payload:', decoded);
// {
//   sub: "9e2ae620-02bf-4351-86c0-a90376b4353c",
//   unique_name: "Admin",
//   email: "DevAdmin@gmail.com",
//   permissions: [...],
//   exp: 1770450102,
//   ...
// }
```

## 5. Kiểm tra token hết hạn

```javascript
const user = getUserFromToken();

if (!user) {
  // Token không tồn tại hoặc đã hết hạn
  console.log('Token hết hạn hoặc không hợp lệ');
  // Redirect to login
}
```

## Payload Structure

Access token chứa các thông tin:

```typescript
{
  sub: string;              // User ID (UUID)
  unique_name: string;      // Username
  email: string;            // Email
  jti: string;             // JWT ID
  permissions: string[];    // Array of permissions
  nbf: number;             // Not before timestamp
  exp: number;             // Expiration timestamp
  iat: number;             // Issued at timestamp
  iss: string;             // Issuer
  aud: string;             // Audience
}
```

## Available Permissions

```javascript
const PERMISSIONS = {
  CONTENT_COMMENTS: ['Read', 'Write', 'Delete'],
  CONTENT_POSTS: ['Read', 'Write', 'Delete'],
  REPORT_ANALYTICS: ['Read', 'Write', 'Delete'],
  SYSTEM_ROLES: ['Read', 'Write', 'Delete'],
  SYSTEM_USERS: ['Read', 'Write', 'Delete'],
};

// Format: "CATEGORY.Action"
// Example: "SYSTEM_USERS.Read", "CONTENT_POSTS.Write"
```
