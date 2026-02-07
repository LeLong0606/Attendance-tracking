# Attendance Tracking System

A React-based attendance tracking application with login authentication, dashboard, and API integration.

## Features

- **Login Page**: Authentication with backend API
- **Admin Dashboard**: Profile management and system settings
- **User Dashboard**: View attendance statistics
- **API Integration**: Full backend integration with RESTful API
- **React Router**: Seamless navigation between pages
- **Responsive Design**: Works on desktop and mobile devices
- **Vietnamese Interface**: Fully localized UI

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at:
- **Local:** `https://localhost:5173` (hoặc port khác nếu 5173 đang được sử dụng)
- **Network:** `https://100.116.243.26:5173` (hoặc IP máy của bạn)

**Note:** 
- On first run, your browser may show a security warning about the self-signed certificate. This is normal for local development. Click "Advanced" and "Proceed to localhost" to continue.
- Để truy cập từ máy khác trong mạng, sử dụng địa chỉ Network (ví dụ: `https://100.116.243.26:5173`)

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
attendance-tracking/
├── src/
│   ├── pages/
│   │   ├── Login/
│   │   │   ├── Login.jsx       # Login page with API integration
│   │   │   └── Login.css       # Login page styles
│   │   ├── AdminPage/
│   │   │   ├── Main.jsx        # Admin main page
│   │   │   ├── ProfilePage.jsx # Profile management container
│   │   │   ├── ManageProfile.jsx   # Profile form with API
│   │   │   ├── ManageAccount.jsx   # Account menu
│   │   │   ├── CreditCard.jsx
│   │   │   ├── GiftCard.jsx
│   │   │   ├── ShoppingAddresses.jsx
│   │   │   ├── RecentOrders.jsx
│   │   │   └── *.css           # Component styles
│   │   └── UserPage/
│   │       └── UserPage.jsx    # User dashboard with statistics
│   ├── services/
│   │   └── api.js              # API service layer (axios)
│   ├── App.jsx                 # Main app component with routing
│   ├── main.jsx                # Application entry point
│   └── index.css               # Global styles
├── API_INTEGRATION.md          # API documentation
├── package.json
└── vite.config.js
```

## API Integration

This application connects to a backend API at `https://100.70.202.103:7085/api`

### API Endpoints

- **POST** `/auth/login` - User authentication
- **POST** `/auth/logout` - User logout
- **GET** `/user/profile` - Get user profile
- **PUT** `/user/profile` - Update user profile
- **GET** `/attendance` - Get all attendance records
- **POST** `/attendance` - Create attendance record
- **PUT** `/attendance/{id}` - Update attendance record
- **DELETE** `/attendance/{id}` - Delete attendance record
- **GET** `/attendance/statistics` - Get attendance statistics

For detailed API documentation, see [API_INTEGRATION.md](API_INTEGRATION.md)

## Usage

### Default Credentials
- **Admin Account**: 
  - Username: `Admin`
  - Password: `Admin@123`

### Navigation
1. **Login**: Enter credentials and click "Đăng nhập" 
   - Admin users → redirected to `/main` (Admin Dashboard)
   - Regular users → redirected to `/user-page` (User Dashboard)
2. **Admin Dashboard**: 
   - Manage profile (Quản lý hồ sơ)
   - View shopping addresses (Địa chỉ giao hàng)
   - Manage credit cards (Thẻ tín dụng)
   - View gift cards (Thẻ quà tặng)
   - Check recent orders (Đơn hàng gần đây)
3. **User Dashboard**: View attendance statistics
4. **Logout**: Click "Đăng xuất" button in the header

## Technologies Used

- React 19.2.0
- React Router DOM 6.22.0
- Axios 1.7.9 (HTTP client for API calls)
- Vite 7.2.4
- CSS3 for styling

## Backend Requirements

⚠️ **QUAN TRỌNG:** Backend PHẢI cấu hình CORS để frontend hoạt động!

The frontend expects a backend API running at `https://100.70.202.103:7085/api` with the following:

1. CORS enabled for:
   - `https://localhost:5173` (và các port khác như 5174, 5175)
   - `https://100.116.243.26:5173` (khi chạy trên network)
2. SSL certificate properly configured
3. Endpoints as documented in [API_INTEGRATION.md](API_INTEGRATION.md)

**📖 Chi tiết cấu hình backend: Xem [BACKEND_SETUP.md](BACKEND_SETUP.md)**

**Cấu hình CORS nhanh (.NET Core):**
```csharp
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

app.UseCors("AllowFrontend");
```

## Development Notes

- All API calls include error handling and fallback to mock data
- Token-based authentication using Authorization header
- Loading states for better UX
- Vietnamese language interface

