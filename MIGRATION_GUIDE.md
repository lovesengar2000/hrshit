# Migration Guide: From Vanilla JS to Next.js

## Overview

This guide explains how the original vanilla JavaScript/HTML application has been converted to Next.js with React components.

## File Mapping

### HTML Files → Next.js Pages

| Original File | Next.js Equivalent | Location |
|---|---|---|
| `index.html` | `app/page.js` | Root authentication page |
| `dashboard.html` | `app/dashboard/page.js` | User dashboard |
| `admin-dashboard.html` | `app/admin/page.js` | Admin dashboard |
| `apply-leave.html` | `app/leave/apply/page.js` | Apply leave form |
| `manage-leave.html` | `app/admin/leaves/page.js` | Admin leave management |
| `manage-users.html` | `app/admin/users/page.js` | Admin user management |
| `attendance.html` | `app/attendance/page.js` | Attendance tracking |
| `view-assets.html` | `app/assets/page.js` | Asset viewing |

### JavaScript Files → React Components/Services

| Original File | Next.js Equivalent | Type |
|---|---|---|
| `js/auth.js` | `lib/authAPI.js` | API Service Class |
| `js/app.js` | `app/page.js` | Auth Component |
| `js/dashboard.js` | `app/dashboard/page.js` | React Component |
| `js/admin-dashboard.js` | `app/admin/page.js` | React Component |
| `js/apply-leave.js` | `app/leave/apply/page.js` | React Component |
| `js/manage-leave.js` | `app/admin/leaves/page.js` | React Component |
| `js/manage-users.js` | `app/admin/users/page.js` | React Component |
| `js/attendance.js` | `app/attendance/page.js` | React Component |

### CSS Files → Next.js CSS Modules

| Original File | Next.js Equivalent |
|---|---|
| `css/style.css` | Split into: |
| | `app/styles/auth.css` |
| | `app/styles/dashboard.css` |
| | `app/globals.css` |

## Code Conversion Examples

### 1. Object Initialization

**Original (Vanilla JS)**
```javascript
class AuthApp {
    constructor() {
        this.currentStep = 1;
        this.init();
    }

    init() {
        this.bindEvents();
        if (authAPI.isAuthenticated()) {
            this.redirectBasedOnRole();
        }
    }

    bindEvents() {
        this.checkEmailBtn = document.getElementById('checkEmailBtn');
        this.checkEmailBtn.addEventListener('click', () => this.handleCheckEmail());
    }
}

const authApp = new AuthApp();
```

**Next.js (React Hooks)**
```javascript
'use client';

import { useState, useEffect } from 'react';

export default function AuthPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (authAPI.isAuthenticated()) {
      if (authAPI.isAdmin()) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    // Handler logic
  };

  return (
    <form onSubmit={handleCheckEmail}>
      <input type="email" />
      <button type="submit">Continue</button>
    </form>
  );
}
```

### 2. DOM Manipulation

**Original (Vanilla JS)**
```javascript
showStep(step) {
    this.steps.forEach(el => el.classList.remove('active'));
    this.stepLines.forEach(el => el.classList.remove('active'));
    
    const stepNum = parseInt(step);
    for (let i = 0; i < stepNum; i++) {
        this.steps[i].classList.add('active');
    }
    
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById(`step${step}`).style.display = 'block';
}
```

**Next.js (Conditional Rendering)**
```javascript
{currentStep === 1 && (
  <form className="form-step active" onSubmit={handleCheckEmail}>
    {/* Form content */}
  </form>
)}

{currentStep === 2 && (
  <form className="form-step active" onSubmit={handleLogin}>
    {/* Form content */}
  </form>
)}
```

### 3. Event Handling

**Original (Vanilla JS)**
```javascript
checkEmailBtn.addEventListener('click', async () => {
    try {
        this.loadingDiv.style.display = 'flex';
        const result = await authAPI.checkEmail(this.emailInput.value);
        this.loadingDiv.style.display = 'none';
        
        if (result.success) {
            this.messageDiv.textContent = 'Success!';
            this.messageDiv.className = 'message message-success';
        }
    } catch (error) {
        console.error(error);
    }
});
```

**Next.js (React State)**
```javascript
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState('');

const handleCheckEmail = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const result = await authAPI.checkEmail(email);
    if (result.success) {
      setMessage('Success!');
      setMessageType('success');
    }
  } finally {
    setLoading(false);
  }
};
```

### 4. Data Fetching

**Original (Vanilla JS)**
```javascript
async loadUserData() {
    const userData = await authAPI.getUserData(this.userId, this.companyId);
    if (userData.success) {
        this.userNameElement.textContent = userData.data.name;
        this.userEmailElement.textContent = userData.data.email;
    }
}

// Called in constructor
this.loadUserData();
```

**Next.js (useEffect Hook)**
```javascript
const [user, setUser] = useState(null);

useEffect(() => {
  loadUserData();
}, []);

const loadUserData = async () => {
  const userData = await authAPI.getUserData(userId, companyId);
  if (userData.success) {
    setUser(userData.data);
  }
};
```

### 5. Navigation/Routing

**Original (Vanilla JS)**
```javascript
redirectBasedOnRole() {
    if (authAPI.isAdmin()) {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}
```

**Next.js (Router)**
```javascript
const router = useRouter();

useEffect(() => {
    if (authAPI.isAdmin()) {
        router.push('/admin');
    } else {
        router.push('/dashboard');
    }
}, [router]);
```

### 6. Form Handling

**Original (Vanilla JS)**
```javascript
handleRegisterCompany() {
    const companyName = this.companyNameInput.value;
    const domain = this.domainInput.value;
    const password = this.registerPasswordInput.value;
    
    if (!companyName || !domain || !password) {
        this.showMessage('Fill all fields', 'error');
        return;
    }

    const result = await authAPI.registerCompany(
        this.userEmail,
        companyName,
        domain,
        password
    );
    
    if (result.success) {
        window.location.href = 'admin-dashboard.html';
    }
}
```

**Next.js (Form State)**
```javascript
const [formData, setFormData] = useState({
  companyName: '',
  domain: '',
  password: '',
  confirmPassword: ''
});

const handleRegisterCompany = async (e) => {
  e.preventDefault();
  
  if (!formData.companyName || !formData.domain) {
    showMessage('Fill all fields', 'error');
    return;
  }

  const result = await authAPI.registerCompany(
    email,
    formData.companyName,
    formData.domain,
    formData.password
  );
  
  if (result.success) {
    router.push('/admin');
  }
};
```

### 7. Table Rendering

**Original (Vanilla JS)**
```javascript
async loadLeaves() {
    const leaves = await authAPI.getUserLeaves(this.companyId, this.userId);
    
    let html = '<table><thead><tr><th>Type</th><th>From</th></tr></thead><tbody>';
    leaves.forEach(leave => {
        html += `<tr>
            <td>${leave.leaveTypeName}</td>
            <td>${new Date(leave.startDate).toLocaleDateString()}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    
    this.leaveTableContainer.innerHTML = html;
}
```

**Next.js (JSX)**
```javascript
{leaves.map(leave => (
  <tr key={leave.id}>
    <td>{leave.leaveTypeName}</td>
    <td>{new Date(leave.startDate).toLocaleDateString()}</td>
  </tr>
))}
```

## Key Concepts Converted

### 1. **Lifecycle Management**
- **Before**: Constructor + init() + event listeners
- **After**: useEffect hooks + automatic cleanup

### 2. **State Management**
- **Before**: Class properties and DOM elements
- **After**: React useState hooks

### 3. **DOM Updates**
- **Before**: Direct DOM manipulation (innerHTML, textContent, style)
- **After**: Reactive JSX rendering

### 4. **Routing**
- **Before**: window.location.href
- **After**: Next.js useRouter hook

### 5. **API Calls**
- **Before**: Scattered throughout classes
- **After**: Centralized in API service class

### 6. **Styling**
- **Before**: Global CSS with multiple selectors
- **After**: CSS files organized by feature

## Performance Improvements

✅ **Code Splitting**: Each route is a separate chunk
✅ **Automatic Optimization**: Next.js handles compression
✅ **Image Optimization**: Ready for next/image
✅ **SEO**: Built-in Meta tags support
✅ **Fast Refresh**: Instant feedback during development

## Removed Files

The following files are no longer needed:

- `index.html` (replaced by app/page.js)
- `dashboard.html` (replaced by app/dashboard/page.js)
- `admin-dashboard.html` (replaced by app/admin/page.js)
- `apply-leave.html` (replaced by app/leave/apply/page.js)
- `manage-leave.html` (replaced by app/admin/leaves/page.js)
- `manage-users.html` (replaced by app/admin/users/page.js)
- `attendance.html` (replaced by app/attendance/page.js)
- `view-assets.html` (replaced by app/assets/page.js)

All individual JS files in `js/` folder are now integrated as React components.

## API Service Layer

The `authAPI` class remains mostly the same for backward compatibility, but now:
- Uses modern async/await patterns
- Better error handling
- Exported as a singleton
- Ready for React component usage

## Browser DevTools

### Before (Vanilla JS)
- Large JavaScript bundle
- Direct DOM queries visible
- Event listeners in console

### After (Next.js)
- Code splitting per route
- React DevTools support
- Performance improvements
- Source maps for debugging

## Migration Checklist

- [x] Convert HTML files to React components
- [x] Convert JavaScript classes to React hooks
- [x] Set up Next.js routing
- [x] Migrate CSS to Next.js format
- [x] Update authentication flow
- [x] Configure API service layer
- [x] Set up navigation component
- [x] Add responsive design
- [x] Implement error handling
- [x] Add loading states

---

For detailed API documentation, see [NEXTJS_README.md](./NEXTJS_README.md)
