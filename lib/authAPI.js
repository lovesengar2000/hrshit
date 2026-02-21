// Authentication API functions - Converted from auth.js
class AuthAPI {
  constructor() {
    this.IsProd = true;
    this.baseURL = this.IsProd
      ? "https://corey-unhypnotizable-sippingly.ngrok-free.dev"
      : "http://localhost:3000";
    this.API_BASE_URL = `${this.baseURL}/api/v1/auth`;
    this.EMPLOYEES_API = `${this.baseURL}/api/v1`;
    this.BASE_URL = `${this.baseURL}/api/v1`;
    this.leaveAPI = `${this.baseURL}/api/v1/leave`;
  }

  // Token Management
  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  setCompanyId(companyId) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('companyId', companyId);
    }
  }

  getCompanyId() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('companyId');
    }
    return null;
  }

  setUserId(userId) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userId', userId);
    }
  }

  getUserId() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId');
    }
    return null;
  }

  setUserRole(role) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', role);
    }
  }

  getUserRole() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole');
    }
    return null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  isAdmin() {
    return this.getUserRole() === 'COMPANY_ADMIN';
  }

  parseToken(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const decoded = JSON.parse(atob(parts[1]));
      return decoded;
    } catch (e) {
      return null;
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('companyId');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    }
  }

  // Authentication Methods
  async checkEmail(email) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/checkEmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error checking email:", error);
      throw error;
    }
  }

  async registerCompany(email, companyName, domain, password) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/registerCompany`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          companyName,
          domain,
          password,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        this.setToken(data.token);
        this.setCompanyId(data.companyId);
        this.setUserId(data.userId);
        this.setUserRole('COMPANY_ADMIN');
      }
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error registering company:", error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        this.setToken(data.token);
        this.setCompanyId(data.companyId);
        this.setUserId(data.userId);
        this.setUserRole(data.role);
      }
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  async registerEmployee(email, password, otpCode) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/registerEmployee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          otpCode,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        this.setToken(data.token);
        this.setCompanyId(data.companyId);
        this.setUserId(data.userId);
        this.setUserRole('EMPLOYEE');
      }
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error registering employee:", error);
      throw error;
    }
  }

  async resendOTP(email) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/resendOTP`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error resending OTP:", error);
      throw error;
    }
  }

  // User Methods
  async getUserData(userId, companyId) {
    try {
      const token = this.getToken();
      const response = await fetch(
        `${this.EMPLOYEES_API}/employees/${userId}?companyId=${companyId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  }

  async getAllUsers(companyId) {
    try {
      const token = this.getToken();
      const response = await fetch(
        `${this.EMPLOYEES_API}/employees?companyId=${companyId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        data: Array.isArray(data) ? data : data.data || [],
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Leave Methods
  async getLeaveTypes(companyId, authToken) {
    try {
      const token = authToken || this.getToken();
      const response = await fetch(
        `${this.leaveAPI}/types?companyId=${companyId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        data: Array.isArray(data) ? data : data.data || [],
      };
    } catch (error) {
      console.error("Error fetching leave types:", error);
      throw error;
    }
  }

  async applyLeave(leaveData) {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.leaveAPI}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(leaveData),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      console.error("Error applying leave:", error);
      throw error;
    }
  }

  async getLeaveBalance(companyId, employeeId) {
    try {
      const token = this.getToken();
      const response = await fetch(
        `${this.leaveAPI}/balance?companyId=${companyId}&employeeId=${employeeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      throw error;
    }
  }

  async getUserLeaves(companyId, employeeId) {
    try {
      const token = this.getToken();
      const response = await fetch(
        `${this.leaveAPI}?companyId=${companyId}&employeeId=${employeeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        data: Array.isArray(data) ? data : data.data || [],
      };
    } catch (error) {
      console.error("Error fetching user leaves:", error);
      throw error;
    }
  }

  async getAllLeaveRequestsAdmin(companyId, authToken) {
    try {
      const token = authToken || this.getToken();
      const response = await fetch(
        `${this.leaveAPI}/admin/all?companyId=${companyId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        data: Array.isArray(data) ? data : data.data || [],
      };
    } catch (error) {
      console.error("Error fetching all leave requests:", error);
      throw error;
    }
  }

  async approveLeave(leaveId, companyId) {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.leaveAPI}/${leaveId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyId }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      console.error("Error approving leave:", error);
      throw error;
    }
  }

  async rejectLeave(leaveId, companyId, reason) {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.leaveAPI}/${leaveId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyId, reason }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      console.error("Error rejecting leave:", error);
      throw error;
    }
  }

  // Attendance Methods
  async clockIn(companyId, employeeId) {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.BASE_URL}/attendance/clockIn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyId, employeeId }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      console.error("Error clocking in:", error);
      throw error;
    }
  }

  async clockOut(companyId, employeeId) {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.BASE_URL}/attendance/clockOut`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyId, employeeId }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      console.error("Error clocking out:", error);
      throw error;
    }
  }

  async getAttendance(companyId, employeeId) {
    try {
      const token = this.getToken();
      const response = await fetch(
        `${this.BASE_URL}/attendance?companyId=${companyId}&employeeId=${employeeId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return {
        success: response.ok,
        data: Array.isArray(data) ? data : data.data || [],
      };
    } catch (error) {
      console.error("Error fetching attendance:", error);
      throw error;
    }
  }
}

// Export singleton instance
const authAPI = new AuthAPI();
export default authAPI;
