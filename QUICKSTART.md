# 🚀 Quick Start Guide

Get your Next.js HR Dashboard up and running in 5 minutes!

## ⚡ Quick Start

### 1️⃣ Install Dependencies (2 minutes)
```bash
npm install
```

### 2️⃣ Setup Environment (1 minute)
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local and add your API endpoint
# NEXT_PUBLIC_API_BASE_URL=https://your-api-url
```

### 3️⃣ Run Development Server (1 minute)
```bash
npm run dev
```

### 4️⃣ Open in Browser (1 minute)
Open [http://localhost:3000](http://localhost:3000) and you're done! ✅

---

## 📖 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

---

## 🔐 First Time Setup

### Step 1: Configure API
Edit `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-url-here
```

### Step 2: Test Login
1. Go to http://localhost:3000
2. Enter any email
3. You'll be guided through auth flow

### Step 3: Explore Dashboard
- ✅ User Dashboard: `/dashboard`
- ✅ Admin Dashboard: `/admin`
- ✅ Apply Leave: `/leave/apply`
- ✅ Attendance: `/attendance`
- ✅ Assets: `/assets`

---

## 🎯 Key URLs

| URL | Purpose | Access |
|-----|---------|--------|
| `/` | Authentication | Everyone |
| `/dashboard` | User Dashboard | Authenticated Users |
| `/admin` | Admin Dashboard | Admins Only |
| `/leave/apply` | Apply Leave | Authenticated Users |
| `/leave` | View Leaves | Authenticated Users |
| `/attendance` | Clock In/Out | Authenticated Users |
| `/assets` | View Assets | Authenticated Users |
| `/admin/users` | Manage Users | Admins Only |
| `/admin/leaves` | Manage Leaves | Admins Only |

---

## 🛠️ Common Tasks

### Change API Endpoint
Edit `lib/authAPI.js`:
```javascript
this.baseURL = "https://your-new-api-url";
```

### Add New Page
1. Create folder: `app/new-page/`
2. Create file: `app/new-page/page.js`
3. Add React component with 'use client' directive
4. Update Navbar navigation if needed

### Modify Styles
- Auth styles: `app/styles/auth.css`
- Dashboard styles: `app/styles/dashboard.css`
- Global styles: `app/globals.css`

### Use Authentication
```javascript
import authAPI from '@/lib/authAPI';

// Check if authenticated
if (!authAPI.isAuthenticated()) {
  router.push('/');
}

// Check if admin
if (authAPI.isAdmin()) {
  // Admin-only code
}

// Get user info
const userId = authAPI.getUserId();
const companyId = authAPI.getCompanyId();

// Logout
authAPI.logout();
```

---

## 🔍 File Quick Reference

| File | Purpose |
|------|---------|
| `app/page.js` | Login page |
| `app/dashboard/page.js` | User dashboard |
| `app/admin/page.js` | Admin dashboard |
| `lib/authAPI.js` | API service |
| `components/Navbar.jsx` | Navigation bar |

---

## 🐛 Common Issues

### "Cannot find module" Error
```bash
npm install
```

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Styles not loading
```bash
rm -rf .next
npm run dev
```

### API not connecting
1. Check `.env.local` API_URL
2. Verify API server is running
3. Check CORS settings on API server

---

## 📚 Full Documentation

Need more help? Check these files:
- **[NEXTJS_README.md](./NEXTJS_README.md)** - Complete setup guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Code conversion details
- **[CONVERSION_SUMMARY.md](./CONVERSION_SUMMARY.md)** - What was converted

---

## ✨ That's It!

Your HR Dashboard is ready to use. Happy coding! 🎉

---

**Questions?** Check the documentation files or review the comments in the code.
