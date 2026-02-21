# HR Dashboard - Next.js Version

This is a modern React-based HR Management System built with Next.js, replacing the vanilla JavaScript implementation.

## Features

✅ **Authentication System**
- Multi-step authentication flow
- Email verification
- Company registration
- Employee registration with OTP
- Secure token-based authentication

✅ **User Dashboard**
- Employee profile and information
- Attendance tracking with clock in/out
- Leave balance display
- Leave application management
- Company assets tracking

✅ **Admin Dashboard**
- User management
- Leave request approval/rejection
- Company statistics and overview
- Employee leave tracking

✅ **Leave Management**
- Apply for leave with multiple types
- View leave history
- Track leave balance
- Leave approval workflow
- Admin leave management

✅ **Attendance Management**
- Clock in/out functionality
- Daily attendance tracking
- Work hour calculation
- Attendance history

✅ **Asset Management**
- View assigned company assets
- Asset details and serial numbers

## Tech Stack

- **Framework**: Next.js 14+
- **UI**: React 18
- **Styling**: CSS3 with CSS Modules
- **State Management**: React Hooks
- **HTTP Client**: Fetch API
- **Authentication**: JWT Token-based

## Project Structure

```
app/
├── layout.js                 # Root layout
├── page.js                   # Authentication page
├── globals.css              # Global styles
│
├── dashboard/
│   └── page.js             # User dashboard
│
├── admin/
│   ├── page.js             # Admin dashboard
│   ├── users/page.js       # User management
│   └── leaves/page.js      # Leave management
│
├── leave/
│   ├── page.js             # View leaves
│   └── apply/page.js       # Apply leave form
│
├── attendance/
│   └── page.js             # Attendance tracking
│
├── assets/
│   └── page.js             # View assets
│
└── styles/
    ├── auth.css            # Authentication styles
    └── dashboard.css       # Dashboard styles

lib/
├── authAPI.js              # API service layer
components/
├── Navbar.jsx              # Navigation component
```

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Step 1: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 2: Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=https://corey-unhypnotizable-sippingly.ngrok-free.dev
```

You can also modify the `lib/authAPI.js` to change the API endpoint:

```javascript
this.baseURL = this.IsProd
  ? "https://your-api-url"
  : "http://localhost:3000";
```

### Step 3: Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## Key Changes from Original

| Original | Next.js Version |
|----------|-----------------|
| Vanilla HTML/JS | React Components |
| Plain CSS | CSS Modules + Global CSS |
| DOM Manipulation | React State Management |
| Window.location redirects | Next.js Router |
| LocalStorage directly | Encapsulated in authAPI |
| Multiple HTML files | Dynamic routing |
| Inline scripts | Components & Hooks |

## Component Architecture

### API Layer (lib/authAPI.js)
The `AuthAPI` class handles all API communication:
- Token management
- User authentication
- Leave management
- Attendance tracking
- Admin operations

### Page Components
Each route is a React component that:
- Uses Next.js routing
- Manages local state with useState
- Effects with useEffect
- Calls authAPI for data

### Navbar Component
Reusable navigation bar with:
- Logout functionality
- Quick navigation links
- Responsive design

## Authentication Flow

1. **Step 1**: Email verification
   - Check if email exists
   - Route to login or registration

2. **Step 2**: Login/Company Registration
   - For existing users: password entry
   - For new company: company details + password

3. **Step 3**: Employee Registration
   - OTP verification
   - Password setup
   - Account creation

## API Integration

The application communicates with your backend API. Ensure your API endpoint is configured in `lib/authAPI.js`.

### Required API Endpoints

**Authentication**
- `POST /api/v1/auth/checkEmail`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/registerCompany`
- `POST /api/v1/auth/registerEmployee`
- `POST /api/v1/auth/resendOTP`

**Users**
- `GET /api/v1/employees/:userId`
- `GET /api/v1/employees`

**Leaves**
- `GET /api/v1/leave/types`
- `POST /api/v1/leave/apply`
- `GET /api/v1/leave/balance`
- `GET /api/v1/leave`
- `GET /api/v1/leave/admin/all`
- `POST /api/v1/leave/:id/approve`
- `POST /api/v1/leave/:id/reject`

**Attendance**
- `POST /api/v1/attendance/clockIn`
- `POST /api/v1/attendance/clockOut`
- `GET /api/v1/attendance`

## Security Features

✓ JWT Token-based authentication
✓ Secure token storage in localStorage
✓ Protected routes with authentication checks
✓ Role-based access control (ADMIN vs EMPLOYEE)
✓ API authorization headers

## Responsive Design

The application is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices

## Styling

### Global Styles (app/globals.css)
- Body background
- Base font configuration

### Auth Styles (app/styles/auth.css)
- Authentication page styling
- Form elements
- Login/registration flows

### Dashboard Styles (app/styles/dashboard.css)
- Dashboard layout
- Cards and components
- Tables and data displays
- Responsive grid system

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### "Not authenticated" error
- Check if token is stored in localStorage
- Verify API credentials are correct
- Check if API endpoint is accessible

### CORS issues
- Ensure your API has proper CORS headers
- Check development server is running

### Styling not loading
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Token expired
- User will be redirected to login
- Clear localStorage and re-authenticate

## Future Enhancements

- [ ] Add notifications/alerts system
- [ ] Implement real-time updates with WebSocket
- [ ] Add email notifications
- [ ] Export reports to PDF
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Calendar view for leaves
- [ ] Performance optimizations

## License

This project is provided as-is for educational and commercial use.

## Support

For issues or questions, please contact the development team.

---

**Last Updated**: February 2025
**Next.js Version**: 14.0+
