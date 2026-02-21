# Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│                   (Client-Side Routing)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Page Routes (app/)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Auth Page       │  │  Dashboard       │                 │
│  │  (app/page.js)   │  │  (app/dashboard) │                 │
│  └──────────────────┘  └──────────────────┘                 │
│         │                     │                              │
│         └─────────┬───────────┘                              │
│                   │                                           │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Admin           │  │  Leave           │                 │
│  │  (app/admin)     │  │  (app/leave)     │                 │
│  └──────────────────┘  └──────────────────┘                 │
│         │                     │                              │
│         └─────────┬───────────┘                              │
│                   │                                           │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Attendance      │  │  Assets          │                 │
│  │  (app/attendance)│  │  (app/assets)    │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Components & Services                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Navbar Component (components/)               │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ - Navigation Links                           │   │   │
│  │  │ - Logout Functionality                       │   │   │
│  │  │ - User Info Display                          │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     AuthAPI Service (lib/authAPI.js)                │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ - Authentication Methods                     │   │   │
│  │  │ - Token Management                           │   │   │
│  │  │ - Leave API Methods                          │   │   │
│  │  │ - Attendance API Methods                     │   │   │
│  │  │ - User Management Methods                    │   │   │
│  │  │ - Error Handling                             │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│             Backend API Server                              │
│        (Your External API Endpoints)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✓ /api/v1/auth/checkEmail      ✓ /api/v1/employees       │
│  ✓ /api/v1/auth/login           ✓ /api/v1/leave/*         │
│  ✓ /api/v1/auth/registerCompany ✓ /api/v1/attendance/*    │
│  ✓ /api/v1/auth/registerEmployee                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database                                    │
│         (Managed by Your Backend)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Authentication Flow
```
User Input → Auth Page → AuthAPI.checkEmail() → Router Decision
                ↓
         Login Path            Register Path
            │                      │
            ▼                      ▼
     AuthAPI.login()      AuthAPI.registerCompany()
            │                      │
            ▼                      ▼
      localStorage        localStorage + Router
            │                      │
            ▼                      ▼
       /dashboard               /admin
```

### Leave Application Flow
```
Apply Leave Form → Input Validation → AuthAPI.applyLeave()
                                              ↓
                                    API Submission
                                              ↓
                                    Leave Recorded
                                              ↓
                                    Redirect to Leaves
```

### Attendance Flow
```
Clock In Button → AuthAPI.clockIn() → API Call
                                        ↓
                                   Record Time
                                        ↓
                                   Update UI State
```

---

## Component Hierarchy

```
RootLayout
├── AuthPage (app/page.js)
│   └── Form Steps (1, 2, 3)
│
├── DashboardPage (app/dashboard/page.js)
│   ├── Navbar
│   ├── Welcome Section
│   ├── Statistics Cards
│   ├── Action Cards
│   ├── Leave Table
│   └── Loading States
│
├── AdminDashboard (app/admin/page.js)
│   ├── Navbar
│   ├── Statistics Cards
│   ├── User Cards
│   └── Leave Requests Table
│
├── LeavePages (app/leave/*)
│   ├── ApplyLeave Form
│   └── ViewLeaves Table
│
├── AttendancePage (app/attendance/page.js)
│   ├── Navbar
│   ├── Clock Status
│   └── History Table
│
└── AssetsPage (app/assets/page.js)
    ├── Navbar
    └── Assets Table
```

---

## State Management Flow

```
User Interaction
        │
        ▼
useState Hook
        │
        ▼
Event Handler
        │
        ▼
API Call (authAPI)
        │
        ▼
Update State (setState)
        │
        ▼
Component Re-render
        │
        ▼
Updated UI
```

---

## Files Structure

```
app/                          # Next.js App Router
├── page.js                   # Root (Auth)
├── layout.js                 # Root Layout
├── globals.css               # Global Styles
├── styles/
│   ├── auth.css             # Auth Styles
│   └── dashboard.css        # Dashboard Styles
├── dashboard/
│   └── page.js              # User Dashboard
├── admin/
│   ├── page.js              # Admin Dashboard
│   ├── users/page.js        # User Management
│   └── leaves/page.js       # Leave Management
├── leave/
│   ├── page.js              # View Leaves
│   └── apply/page.js        # Apply Leave
├── attendance/
│   └── page.js              # Attendance Tracking
└── assets/
    └── page.js              # Assets Viewing

lib/                          # Shared Utilities
├── authAPI.js               # API Service Class

components/                   # Reusable Components
└── Navbar.jsx               # Navigation Component

Root Files
├── package.json             # Dependencies
├── next.config.js           # Next.js Config
├── jsconfig.json            # JavaScript Config
├── .env.example             # Environment Template
├── .env.local               # Environment (local)
├── .nvmrc                   # Node Version
├── .gitignore               # Git Ignore Rules

Documentation
├── QUICKSTART.md            # Quick Start Guide
├── NEXTJS_README.md         # Full Documentation
├── MIGRATION_GUIDE.md       # Migration Details
└── CONVERSION_SUMMARY.md    # Overview
```

---

## Authentication & Authorization

```
┌─────────────────┐
│   Login Page    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  Check Authentication    │
│  (authAPI.isAuth)        │
└────────┬────────┬────────┘
         │        │
    YES  │        │  NO
         ▼        ▼
    Continue   Redirect to "/"
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
    Check Role      Check Role
    (authAPI.isAdmin)
         │                 │
    ADMIN │               │ EMPLOYEE
         │                 │
         ▼                 ▼
    /admin            /dashboard
```

---

## API Call Pattern

```javascript
// All pages follow this pattern:

const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  // Call API via authAPI service
  const result = await authAPI.someMethod();
  
  if (result.success) {
    setData(result.data);  // Update state
  } else {
    setError(result.data?.message);  // Show error
  }
  
  setLoading(false);
}, [dependency]);
```

---

## Style Cascading

```
globals.css (Base)
    ├── Body styling
    ├── HTML/Element defaults
    └── Base colors
         │
         ▼
    auth.css (Auth-Specific)
         ├── Form styling
         ├── Auth container
         └── Step indicators
              │
              ▼
         dashboard.css (Dashboard-Specific)
              ├── Navbar styling
              ├── Card layout
              ├── Table styles
              ├── Responsive grid
              └── Button variants
```

---

## Environment Setup

```
.env.example           (Template)
        │
        ▼
    cp to .env.local
        │
        ▼
    Edit with API URL
        │
        ▼
    npm run dev
        │
        ▼
    Application loads from .env.local
```

---

## Deployment Flow

```
Development
    ↓
npm run build
    ↓
.next/ (Production files)
    ↓
npm start or Deploy to Vercel/Netlify
    ↓
Production Server
```

---

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Reusable components
- ✅ Centralized API handling
- ✅ Easy to maintain and extend
- ✅ Scalable structure
