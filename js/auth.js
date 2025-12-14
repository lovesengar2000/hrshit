// Authentication API functions
class AuthAPI {
  constructor() {
    this.IsProd = false; // Set to true in production
    this.baseURL = this.IsProd
      ? "https://corey-unhypnotizable-sippingly.ngrok-free.dev"
      : "http://localhost:3000";
    this.API_BASE_URL = `${this.baseURL}/api/v1/auth`;
    this.EMPLOYEES_API = `${this.baseURL}/api/v1`;
    this.BASE_URL = `${this.baseURL}/api/v1`;
    this.leaveAPI = `${this.baseURL}/api/v1/leave`;
  }

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

      console.log("Check Email Response:", data); // Debug log

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
  // Admin: compute leave summaries for all users (group by userId)
  async getAllUsersLeaveSummaries(companyId, authToken) {
    try {
      const company = companyId || this.getCompanyId();
      let token = authToken || this.getToken();
      let tokenToParse = token;
      if (typeof token === "string" && token.startsWith("Bearer "))
        tokenToParse = token.slice(7);

      const tokenData = this.parseToken(tokenToParse);
      if (!tokenData || tokenData.role !== "COMPANY_ADMIN") {
        return {
          success: false,
          status: 403,
          data: null,
          message: "Access denied. Admins only.",
        };
      }

      // Fetch all leaves via admin endpoint
      const allRes = await this.getAllLeaveRequestsAdmin(company, tokenToParse);
      if (!allRes || !allRes.success || !Array.isArray(allRes.data)) {
        return { success: false, data: [], message: "Failed to fetch leaves" };
      }
      const leaves = allRes.data;

      // Fetch leave types to determine entitlements
      const typesRes = await this.getLeaveTypes(company, tokenToParse);
      const types =
        typesRes && typesRes.success && Array.isArray(typesRes.data)
          ? typesRes.data
          : [];
      const typeMap = {};
      types.forEach((t) => {
        const key = (t.name || t.code || t.id || "").toString().toLowerCase();
        typeMap[key] = t;
      });

      // Group leaves by user identifier
      const usersMap = {};
      leaves.forEach((leave) => {
        const uid = (
          leave.userId ||
          leave.employeeId ||
          (leave.employee && (leave.employee.userId || leave.employee.id)) ||
          leave.appliedBy ||
          "unknown"
        ).toString();
        if (!usersMap[uid]) {
          usersMap[uid] = {
            userId: uid,
            userName:
              leave.employeeName ||
              leave.userName ||
              leave.applicantName ||
              null,
            leaves: [],
          };
        }
        usersMap[uid].leaves.push(leave);
      });

      // For each user compute per-type usage and CL/EL aggregates
      const results = [];
      const getTypeKey = (leave) => {
        if (!leave) return "unknown";
        const name = (
          leave.leaveTypeName ||
          (leave.leaveType && (leave.leaveType.name || leave.leaveTypeId)) ||
          leave.leaveTypeId ||
          leave.code ||
          ""
        ).toString();
        return name.toLowerCase();
      };

      Object.keys(usersMap).forEach((uid) => {
        const entry = usersMap[uid];
        const summaryMap = {};
        const token = authToken || this.getToken();
        entry.leaves.forEach((leave) => {
          const key = getTypeKey(leave) || "unknown";
          if (!summaryMap[key]) {
            const t = typeMap[key];
            const total = t ? t.maxDaysPerYear || t.maxDays || 0 : 0;
            summaryMap[key] = {
              typeName: t?.name || leave.leaveTypeName || key,
              totalDays: total,
              usedDays: 0,
              remainingDays: total,
            };
          }

          if (leave.status === "APPROVED") {
            const start = leave.startDate
              ? new Date(leave.startDate)
              : leave.createdAt
              ? new Date(leave.createdAt)
              : null;
            const end = leave.endDate ? new Date(leave.endDate) : start;
            if (start && end) {
              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
              summaryMap[key].usedDays += days;
              const url = `${
                this.leaveAPI
              }/balance?companyId=${encodeURIComponent(
                company
              )}&employeeId=${encodeURIComponent(eid)}`;
            }
          }
        });

        // Compute CL/EL aggregates
        const aggregate = {
          CL: { total: 0, used: 0, remaining: 0 },
          EL: { total: 0, used: 0, remaining: 0 },
        };
        Object.keys(summaryMap).forEach((k) => {
          const item = summaryMap[k];
          const name = (item.typeName || k).toLowerCase();
          if (
            name.includes("casual") ||
            name === "cl" ||
            name.includes("c l") ||
            name.includes("cas")
          ) {
            aggregate.CL.total += item.totalDays || 0;
            aggregate.CL.used += item.usedDays || 0;
            aggregate.CL.remaining = Math.max(
              0,
              aggregate.CL.total - aggregate.CL.used
            );
          } else if (
            name.includes("earn") ||
            name.includes("annual") ||
            name === "el" ||
            name.includes("el ")
          ) {
            aggregate.EL.total += item.totalDays || 0;
            aggregate.EL.used += item.usedDays || 0;
            aggregate.EL.remaining = Math.max(
              0,
              aggregate.EL.total - aggregate.EL.used
            );
          }
        });

        results.push({
          userId: entry.userId,
          userName: entry.userName,
          leaves: entry.leaves,
          perType: Object.values(summaryMap),
          aggregates: aggregate,
        });
      });

      return { success: true, data: results };
    } catch (error) {
      console.error("Error computing all users leave summaries:", error);
      return { success: false, data: null, message: error.message };
    }
  }

  // Compute leave balance for a specific employee by using the admin allLeaveRequest data
  // This will fetch all leaves via admin endpoint, filter by the employee/user id, and compute per-type used/remaining days
  async getLeaveBalanceFromAllRequests(companyId, employeeId, authToken) {
    try {
      const company = companyId || this.getCompanyId();
      let token = authToken || this.getToken();
      let tokenToParse = token;
      if (typeof token === "string" && token.startsWith("Bearer "))
        tokenToParse = token.slice(7);

      const tokenData = this.parseToken(tokenToParse);
      if (!tokenData || tokenData.role !== "COMPANY_ADMIN") {
        return {
          success: false,
          status: 403,
          data: null,
          message: "Access denied. Admins only.",
        };
      }

      if (!employeeId) {
        return {
          success: false,
          data: null,
          message: "employeeId is required",
        };
      }

      // fetch all leaves for company
      const allRes = await this.getAllLeaveRequestsAdmin(company, tokenToParse);
      if (!allRes || !allRes.success || !Array.isArray(allRes.data)) {
        return {
          success: false,
          data: null,
          message: "Failed to fetch leave requests",
        };
      }
      const leaves = allRes.data;

      // filter leaves for this employee/user
      const userLeaves = leaves.filter((l) => {
        return (
          String(l.employeeId) === String(employeeId) ||
          String(l.userId) === String(employeeId) ||
          (l.employee &&
            (String(l.employee.id) === String(employeeId) ||
              String(l.employee.employeeId) === String(employeeId))) ||
          (l.appliedBy && String(l.appliedBy) === String(employeeId))
        );
      });

      // fetch leave types to determine entitlements
      const typesRes = await this.getLeaveTypes(company, tokenToParse);
      const types =
        typesRes && typesRes.success && Array.isArray(typesRes.data)
          ? typesRes.data
          : [];
      const typeMap = {};
      types.forEach((t) => {
        const key = (t.name || t.code || t.id || "").toString().toLowerCase();
        typeMap[key] = t;
      });

      const getTypeKey = (leave) => {
        if (!leave) return "unknown";
        const name = (
          leave.leaveTypeName ||
          (leave.leaveType && (leave.leaveType.name || leave.leaveTypeId)) ||
          leave.leaveTypeId ||
          leave.code ||
          ""
        ).toString();
        return name.toLowerCase();
      };

      const summaryMap = {};
      userLeaves.forEach((leave) => {
        const key = getTypeKey(leave) || "unknown";
        if (!summaryMap[key]) {
          const t = typeMap[key];
          const total = t ? t.maxDaysPerYear || t.maxDays || 0 : 0;
          summaryMap[key] = {
            typeName: t?.name || leave.leaveTypeName || key,
            totalDays: total,
            usedDays: 0,
            remainingDays: total,
          };
        }

        if (leave.status === "APPROVED") {
          const start = leave.startDate
            ? new Date(leave.startDate)
            : leave.createdAt
            ? new Date(leave.createdAt)
            : null;
          const end = leave.endDate ? new Date(leave.endDate) : start;
          if (start && end) {
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            summaryMap[key].usedDays += days;
            summaryMap[key].remainingDays = Math.max(
              0,
              summaryMap[key].totalDays - summaryMap[key].usedDays
            );
          }
        }
      });

      // Compute CL/EL aggregates
      const aggregate = {
        CL: { total: 0, used: 0, remaining: 0 },
        EL: { total: 0, used: 0, remaining: 0 },
      };
      Object.keys(summaryMap).forEach((k) => {
        const item = summaryMap[k];
        const name = (item.typeName || k).toLowerCase();
        if (
          name.includes("casual") ||
          name === "cl" ||
          name.includes("c l") ||
          name.includes("cas")
        ) {
          aggregate.CL.total += item.totalDays || 0;
          aggregate.CL.used += item.usedDays || 0;
          aggregate.CL.remaining = Math.max(
            0,
            aggregate.CL.total - aggregate.CL.used
          );
        } else if (
          name.includes("earn") ||
          name.includes("annual") ||
          name === "el" ||
          name.includes("el ")
        ) {
          aggregate.EL.total += item.totalDays || 0;
          aggregate.EL.used += item.usedDays || 0;
          aggregate.EL.remaining = Math.max(
            0,
            aggregate.EL.total - aggregate.EL.used
          );
        }
      });

      return {
        success: true,
        data: {
          employeeId: employeeId,
          leaves: userLeaves,
          perType: Object.values(summaryMap),
          aggregates: aggregate,
        },
      };
    } catch (error) {
      console.error("Error computing leave balance from all requests:", error);
      return { success: false, data: null, message: error.message };
    }
  }
  parseToken(token) {
    try {
      // Accept either raw token or full header value 'Bearer <token>'
      let raw = token;
      if (typeof token === "string" && token.startsWith("Bearer ")) {
        raw = token.slice(7);
      }

      const base64Url = raw.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error parsing token:", error);
      return null;
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

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  }

  async register(companyName, domain, adminEmail, adminPassword) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName,
          domain,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error during registration:", error);
      throw error;
    }
  }

  async registerEmployee(OTPCode, email, password) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/registerEmployee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          OTPCode: parseInt(OTPCode),
          email,
          password,
        }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error during employee registration:", error);
      throw error;
    }
  }

  // Utility function to check if user is authenticated
  isAuthenticated() {
    return localStorage.getItem("token") !== null;
  }

    // Get current user data
  getCurrentEmployeeData() {
    const userData = localStorage.getItem("employeeData");
    return userData ? JSON.parse(userData) : null;
  }

  // Get current user data
  getCurrentUser() {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  }

  // Get authentication token
  getToken() {
    return localStorage.getItem("token");
  }

  // Logout function
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Validate OTP code (6 digits)
  isValidOTP(otp) {
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp);
  }
  getUserRole() {
    // First check localStorage
    const storedRole = localStorage.getItem("userRole");
    if (storedRole) {
      return storedRole;
    }

    // If not in localStorage, check token
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.parseToken(token);

    // Check if role exists in token
    if (decoded && decoded.role) {
      return decoded.role;
    }

    // If no role in token, check user data in localStorage
    const userData = this.getCurrentUser();
    if (userData) {
      // Determine role based on user data
      // Company admins usually have special emails or patterns
      // You might need to adjust this logic based on your system
      if (userData.email && userData.email.includes("admin")) {
        return "COMPANY_ADMIN";
      }
    }

    // Default to regular user
    return "EMPLOYEE";
  }

  // Check if user is admin
  isAdmin() {
    const role = this.getUserRole();
    return role === "COMPANY_ADMIN";
  }

  // Check if user is regular user/employee
  isUser() {
    const role = this.getUserRole();
    return role !== "COMPANY_ADMIN";
  }
  // Check if user is regular user/employee

  // Get company ID from token
  getCompanyId() {
    const token = this.getToken();
    if (!token) return null;

    const decoded = this.parseToken(token);
    return decoded ? decoded.companyId : null;
  }

  // Add new employee (Admin only)
  async addEmployee(employeeData) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Adding employee:", employeeData);
      console.log("Using token:", token.substring(0, 20) + "...");

      const response = await fetch(`${this.EMPLOYEES_API}/employees`, {
        method: "POST",
        headers: {
          Authorization: `JWT ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(employeeData),
      });

      console.log("Add employee response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.log("Non-JSON response:", text);
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      const data = await response.json();
      console.log("Add employee response:", data);

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error adding employee:", error);
      throw error;
    }
  }

  // Get all employees for a company (Admin only)
  async getEmployees(companyId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching employees for company:", companyId);
      console.log("Using token:", token.substring(0, 20) + "...");

      const response = await fetch(
        `${this.EMPLOYEES_API}/employees?companyId=${companyId}`,
        {
          method: "GET",
          headers: {
            Authorization: `JWT ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            Accept: "application/json",
          },
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.log("Non-JSON response:", text);
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      const data = await response.json();
      console.log("Employees data received:", data);

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  }
  async getEmployeeById(employeeId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${this.EMPLOYEES_API}/employees/${employeeId}`,
        {
          method: "GET",
          headers: {
            Authorization: `JWT ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching employee:", error);
      throw error;
    }
  }
  async updateEmployee(employeeId, employeeData) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${this.EMPLOYEES_API}/employees/${employeeId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `JWT ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(employeeData),
        }
      );

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  }
  async deleteEmployee(employeeId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${this.EMPLOYEES_API}/employees/${employeeId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `JWT ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }
  }
  async updateEmployeeDetails(employeeId, employeeData) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const companyId = this.getCompanyId();
      if (!companyId) {
        throw new Error("No company ID found");
      }

      console.log("Updating employee:", employeeId, employeeData);

      const response = await fetch(`${this.EMPLOYEES_API}/employees`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          companyId: companyId,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...employeeData,
          employeeId: employeeId,
        }),
      });

      console.log("Update employee response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.log("Non-JSON response:", text);
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      const data = await response.json();
      console.log("Update employee response:", data);

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error updating employee details:", error);
      throw error;
    }
  }

  // Get employee attendance records
  async getEmployeeAttendance(employeeId, startDate, endDate) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      let url = `${this.BASE_URL}/attendance/employee/${employeeId}`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching attendance:", error);
      throw error;
    }
  }

  // Clock in
  async clockIn(companyId, employeeId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Clocking in:", { companyId, employeeId });

      const response = await fetch(`${this.BASE_URL}/attendance/clockin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          employeeId,
          // Location removed as per API requirement
        }),
      });

      console.log("Clock in response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.log("Non-JSON response:", text);
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      const data = await response.json();
      console.log("Clock in response:", data);

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error clocking in:", error);
      throw error;
    }
  }

  // Clock out (without location)
  async clockOut(companyId, employeeId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Clocking out:", { companyId, employeeId });

      const response = await fetch(`${this.BASE_URL}/attendance/clockout`, {
        method: "POST",
        headers: {
          Authorization: `JWT ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          employeeId,
          // Location removed as per API requirement
        }),
      });

      console.log("Clock out response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.log("Non-JSON response:", text);
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      const data = await response.json();
      console.log("Clock out response:", data);

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error clocking out:", error);
      throw error;
    }
  }

  // Get today's attendance status
  async getTodayAttendance(employeeId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `${this.BASE_URL}/attendance/today/${employeeId}?date=${today}`,
        {
          method: "GET",
          headers: {
            Authorization: `JWT ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      throw error;
    }
  }

  // Get current user's employee ID
  async getCurrentUserEmployeeId() {
    try {
      // First check if a currentEmployeeId was stored during login
      const storedCurrentEmp = localStorage.getItem("currentEmployeeId");
      if (storedCurrentEmp) return storedCurrentEmp;

      // Check if employeeData was stored during login
      const storedEmpData = localStorage.getItem("employeeData");
      if (storedEmpData) {
        try {
          const ed = JSON.parse(storedEmpData);
          if (ed && (ed.employeeId || ed.id)) return ed.employeeId || ed.id;
        } catch (e) {
          // ignore parse error
        }
      }

      const user = this.getCurrentUser();
      console.log("Current user:", user); // Debug log

      // First, check if employeeId is directly in user object
      if (user) {
        if (user.employeeId) return user.employeeId;
        if (user.employee && (user.employee.employeeId || user.employee.id))
          return user.employee.employeeId || user.employee.id;
        if (user.profileEmployeeId) return user.profileEmployeeId;
        if (user.profile && (user.profile.employeeId || user.profile.id))
          return user.profile.employeeId || user.profile.id;
        if (user.data && (user.data.employeeId || user.data.id))
          return user.data.employeeId || user.data.id;
        if (user.employeeId === 0) return 0;
      }

      // Check if userId can be used as employeeId (some systems use same ID)
      if (user && user.userId) {
        // Try to fetch employee by userId
        const companyId = this.getCompanyId();
        if (companyId) {
          const employees = await this.getEmployeesByUserId(
            companyId,
            user.userId
          );
          if (employees && employees.length > 0) {
            return employees[0].employeeId;
          }
        }
      }

      // If not found, fetch from employees API using email
      const companyId = this.getCompanyId();
      if (!companyId) {
        console.error("No company ID found");
        return null;
      }

      console.log("Fetching employees for company:", companyId);
      const result = await this.getEmployees(companyId);

      if (result.success && result.data && Array.isArray(result.data)) {
        const employees = result.data;
        console.log("Employees found:", employees.length);

        // Try to find employee by email
        const currentUser = employees.find((emp) => {
          // Check email match
          if (
            emp.email &&
            user.email &&
            emp.email.toLowerCase() === user.email.toLowerCase()
          ) {
            return true;
          }
          // Check username match
          if (
            emp.username &&
            user.username &&
            emp.username.toLowerCase() === user.username.toLowerCase()
          ) {
            return true;
          }
          // Check if userId matches
          if (emp.userId && user.userId && emp.userId === user.userId) {
            return true;
          }
          return false;
        });

        if (currentUser) {
          console.log("Found employee:", currentUser);
          return currentUser.employeeId || currentUser.id;
        } else {
          console.log(
            "No matching employee found. Available employees:",
            employees.map((e) => ({
              email: e.email,
              username: e.username,
              userId: e.userId,
              employeeId: e.employeeId,
            }))
          );
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting employee ID:", error);
      return null;
    }
  }

  // Helper method to get employees by userId
  async getEmployeesByUserId(companyId, userId) {
    try {
      const result = await this.getEmployees(companyId);
      if (result.success && result.data && Array.isArray(result.data)) {
        return result.data.filter((emp) => emp.userId === userId);
      }
      return [];
    } catch (error) {
      console.error("Error getting employees by userId:", error);
      return [];
    }
  }

  async getEmployeeEvents(
    companyId,
    employeeId,
    startDate = null,
    endDate = null
  ) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const requestBody = {
        companyId,
        employeeId,
      };

      if (startDate) requestBody.startDate = startDate;
      if (endDate) requestBody.endDate = endDate;

      console.log("Fetching employee events with:", requestBody);

      const response = await fetch(
        `${this.BASE_URL}/attendance/getEmployeeEvents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Get employee events response status:", response.status);

      if (!response.ok) {
        console.error("API error:", response.status, response.statusText);
        return {
          success: false,
          status: response.status,
          data: null,
        };
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.log("Non-JSON response:", text);
        return {
          success: false,
          status: response.status,
          data: { message: "Invalid response format" },
        };
      }

      const data = await response.json();
      console.log("Employee events data received:", data);

      return {
        success: true,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error getting employee events:", error);
      return {
        success: false,
        status: 0,
        data: { message: error.message },
      };
    }
  }

  // Get today's attendance status from events
  async getTodayAttendanceFromEvents(companyId, employeeId) {
    try {
      console.log("Getting today's attendance for:", { companyId, employeeId });

      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      console.log(
        "Date range:",
        startOfDay.toISOString(),
        "to",
        endOfDay.toISOString()
      );

      const result = await this.getEmployeeEvents(
        companyId,
        employeeId,
        startOfDay.toISOString(),
        endOfDay.toISOString()
      );

      console.log("Today's events result:", result);

      if (result.success && Array.isArray(result.data)) {
        const todayEvents = result.data;
        console.log("Today events found:", todayEvents.length);

        if (todayEvents.length === 0) {
          return {
            clockInTime: null,
            clockOutTime: null,
            events: [],
          };
        }

        // Sort events by time (descending - newest first)
        todayEvents.sort(
          (a, b) => new Date(b.eventTime) - new Date(a.eventTime)
        );

        // Find the latest CLOCK_IN and CLOCK_OUT
        let clockInEvent = null;
        let clockOutEvent = null;

        // Process events to find proper pairs
        const eventsByType = {
          CLOCK_IN: [],
          CLOCK_OUT: [],
        };

        todayEvents.forEach((event) => {
          if (event.eventType === "CLOCK_IN") {
            eventsByType.CLOCK_IN.push(event);
          } else if (event.eventType === "CLOCK_OUT") {
            eventsByType.CLOCK_OUT.push(event);
          }
        });

        // Sort each type by time (newest first)
        eventsByType.CLOCK_IN.sort(
          (a, b) => new Date(b.eventTime) - new Date(a.eventTime)
        );
        eventsByType.CLOCK_OUT.sort(
          (a, b) => new Date(b.eventTime) - new Date(a.eventTime)
        );

        // Get the latest of each type
        clockInEvent = eventsByType.CLOCK_IN[0] || null;
        clockOutEvent = eventsByType.CLOCK_OUT[0] || null;

        console.log("Latest events:", { clockInEvent, clockOutEvent });

        return {
          clockInTime: clockInEvent ? clockInEvent.eventTime : null,
          clockOutTime: clockOutEvent ? clockOutEvent.eventTime : null,
          clockInEvent: clockInEvent,
          clockOutEvent: clockOutEvent,
          events: todayEvents,
          allClockIns: eventsByType.CLOCK_IN,
          allClockOuts: eventsByType.CLOCK_OUT,
        };
      }

      console.log("No events array found in response");
      return {
        clockInTime: null,
        clockOutTime: null,
        events: [],
      };
    } catch (error) {
      console.error("Error getting today's attendance from events:", error);
      return {
        clockInTime: null,
        clockOutTime: null,
        events: [],
      };
    }
  }

  // Get attendance summary for period
  async getAttendanceSummary(companyId, employeeId, startDate, endDate) {
    try {
      console.log("Getting attendance summary for:", {
        companyId,
        employeeId,
        startDate,
        endDate,
      });

      const result = await this.getEmployeeEvents(
        companyId,
        employeeId,
        startDate,
        endDate
      );

      if (result.success && Array.isArray(result.data)) {
        const events = result.data;
        console.log("Total events found:", events.length);

        // Group events by date
        const eventsByDate = {};
        events.forEach((event) => {
          const date = new Date(event.eventTime).toISOString().split("T")[0];
          if (!eventsByDate[date]) {
            eventsByDate[date] = [];
          }
          eventsByDate[date].push(event);
        });

        console.log(
          "Events grouped by date:",
          Object.keys(eventsByDate).length
        );

        // Process each day's events
        const dailySummaries = [];
        Object.keys(eventsByDate).forEach((date) => {
          const dayEvents = eventsByDate[date];
          console.log(`Processing ${date}: ${dayEvents.length} events`);

          // Sort events by time (ascending)
          dayEvents.sort(
            (a, b) => new Date(a.eventTime) - new Date(b.eventTime)
          );

          // Find pairs of CLOCK_IN and CLOCK_OUT
          let clockInTime = null;
          let clockOutTime = null;
          let totalHours = 0;
          let lastClockIn = null;

          // Process events in chronological order
          for (const event of dayEvents) {
            if (event.eventType === "CLOCK_IN") {
              lastClockIn = new Date(event.eventTime);
              clockInTime = event.eventTime;
            } else if (event.eventType === "CLOCK_OUT" && lastClockIn) {
              const clockOut = new Date(event.eventTime);
              totalHours += (clockOut - lastClockIn) / (1000 * 60 * 60);
              clockOutTime = event.eventTime;
              lastClockIn = null; // Reset for next pair
              dailySummaries.push({
                date,
                clockInTime,
                clockOutTime,
                hoursWorked: totalHours.toFixed(2),
                status: "COMPLETED",
              });
            }
          }

          let status = "PENDING";
          // Determine status
          if (lastClockIn) {
            status = "IN_PROGRESS"; // Clocked in but not out
          } else if (totalHours > 0) {
            status = "COMPLETED";
          }
          if (lastClockIn != null) {
            dailySummaries.push({
              date,
              clockInTime,
              clockOutTime,
              hoursWorked: totalHours.toFixed(2),
              status,
              eventCount: dayEvents.length,
              firstEventTime: dayEvents[0]?.eventTime,
              lastEventTime: dayEvents[dayEvents.length - 1]?.eventTime,
            });
          }
        });

        // Sort by date descending
        dailySummaries.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log("Daily summaries created:", dailySummaries.length);
        return dailySummaries;
      }

      console.log("No events data for summary");
      return [];
    } catch (error) {
      console.error("Error getting attendance summary:", error);
      return [];
    }
  }
  async  GetComapnyLeaveTypes() {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${this.leaveAPI}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          companyId: this.getCompanyId(),
        }
      });

      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error creating leave type:", error);
      throw error;
    }
  }
  async createLeaveType(leaveTypeData) {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      const response = await fetch(`${this.leaveAPI}/createLeave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          companyId: this.getCompanyId(),
        },
        body: JSON.stringify(leaveTypeData),
      });

      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error creating leave type:", error);
      throw error;
    }
  }

  async createAsset(assetData) {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      const companyId = this.getCompanyId();
      if (!companyId) throw new Error("No company ID found");

      const response = await fetch(`${this.BASE_URL}/assets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          companyId: companyId,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          ...assetData,
          companyId: companyId,
        }),
      });

      const data = await response.json();
      return {
        success: response.ok || response.status === 200,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error creating asset:", error);
      throw error;
    }
  }

  async addAsset(assetData) {
    // Alias for createAsset
    return this.createAsset(assetData);
  }

  async updateAsset(assetId, assetData) {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      const companyId = this.getCompanyId();
      if (!companyId) throw new Error("No company ID found");

      const response = await fetch(`${this.BASE_URL}/assets`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          companyId: companyId,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          assetId: assetId,
          ...assetData,
          companyId: companyId,
        }),
      });

      const data = await response.json();
      return {
        success: response.ok || response.status === 200,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error updating asset:", error);
      throw error;
    }
  }

  async deleteAsset(assetId) {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      const companyId = this.getCompanyId();

      const response = await fetch(`${this.BASE_URL}/assets`, {
          body: JSON.stringify({ assetId: assetId }),
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          companyId: companyId,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const data = await response.json();
      return {
        success: response.ok || response.status === 200,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error deleting asset:", error);
      throw error;
    }
  }

  async getAssets(companyId) {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      const company = companyId || this.getCompanyId();

      const response = await fetch(`${this.BASE_URL}/assets?companyId=${encodeURIComponent(company)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          companyId: company,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching assets:", error);
      throw error;
    }
  }

  // NOTE: getAllLeaveRequests is implemented later; this earlier duplicate removed.

  // Get leave requests for current user
  async getUserLeaveRequests() {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      const userId = this.getCurrentUser()?.userId;
      if (!userId) throw new Error("User ID not found");

      // First get all leaves, then filter by user
      const allLeaves = await this.getAllLeaveRequests();

      if (!allLeaves.success || !Array.isArray(allLeaves.data)) {
        return {
          success: false,
          data: [],
          message: "Failed to fetch leaves",
        };
      }

      // Filter leaves by user ID
      const userLeaves = allLeaves.data.filter(
        (leave) =>
          leave.userId === userId ||
          leave.employeeId === userId ||
          (leave.employee &&
            (leave.employee.userId === userId || leave.employee.id === userId))
      );

      return {
        success: true,
        data: userLeaves,
        message: `Found ${userLeaves.length} leave requests`,
      };
    } catch (error) {
      console.error("Error fetching user leave requests:", error);
      return {
        success: false,
        data: [],
        message: error.message,
      };
    }
  }

  // Get leave requests for a specific employee (admin only)
  async getEmployeeLeaveRequests(employeeId) {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      // First get all leaves
      const allLeaves = await this.getAllLeaveRequests();

      if (!allLeaves.success || !Array.isArray(allLeaves.data)) {
        return {
          success: false,
          data: [],
          message: "Failed to fetch leaves",
        };
      }

      // Filter leaves by employee ID
      const employeeLeaves = allLeaves.data.filter(
        (leave) =>
          leave.userId === employeeId ||
          leave.employeeId === employeeId ||
          (leave.employee &&
            (leave.employee.userId === employeeId ||
              leave.employee.id === employeeId))
      );

      return {
        success: true,
        data: employeeLeaves,
        message: `Found ${employeeLeaves.length} leave requests for employee`,
      };
    } catch (error) {
      console.error("Error fetching employee leave requests:", error);
      return {
        success: false,
        data: [],
        message: error.message,
      };
    }
  }

  // Get leave balance for current user
  async getUserLeaveBalance() {
    try {
      // Get user's leave requests
      const userLeaves = await this.getUserLeaveRequests();

      if (!userLeaves.success || !Array.isArray(userLeaves.data)) {
        return {
          success: false,
          data: {},
          message: "Failed to fetch leave balance",
        };
      }

      // Get leave types
      const leaveTypesResult = await this.getLeaveTypes();
      const leaveTypes = leaveTypesResult.success ? leaveTypesResult.data : [];

      // Calculate balance for each leave type
      const balance = {};
      const currentYear = new Date().getFullYear();

      // Initialize balance for each leave type
      leaveTypes.forEach((type) => {
        balance[type.leaveTypeId || type.id] = {
          typeName: type.name || "Unknown",
          maxDays: type.maxDaysPerYear || 0,
          usedDays: 0,
          remainingDays: type.maxDaysPerYear || 0,
          leaveTypeId: type.leaveTypeId || type.id,
        };
      });

      // Calculate used days for current year
      userLeaves.data.forEach((leave) => {
        const leaveDate = new Date(leave.startDate || leave.createdAt);
        if (
          leaveDate.getFullYear() === currentYear &&
          leave.status === "APPROVED"
        ) {
          const leaveTypeId = leave.leaveTypeId || leave.leaveType?.id;
          if (leaveTypeId && balance[leaveTypeId]) {
            // Calculate days between start and end date
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            balance[leaveTypeId].usedDays += days;
            balance[leaveTypeId].remainingDays = Math.max(
              0,
              balance[leaveTypeId].maxDays - balance[leaveTypeId].usedDays
            );
          }
        }
      });

      return {
        success: true,
        data: Object.values(balance),
        message: "Leave balance calculated successfully",
      };
    } catch (error) {
      console.error("Error calculating leave balance:", error);
      return {
        success: false,
        data: [],
        message: error.message,
      };
    }
  }
  async getAllLeaveRequests() {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      const company = this.getCompanyId();
      const url = `${
        this.leaveAPI
      }/allLeaveRequest?companyId=${encodeURIComponent(company)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
          companyId: company,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching all leave requests:", error);
      return {
        success: false,
        data: [],
        message: error.message,
      };
    }
  }

  // Get leave requests for current user (FIXED METHOD)
  async getUserLeaveRequests() {
    try {
      const token = this.getToken();
      if (!token) throw new Error("No authentication token found");

      // Get current user
      const currentUser = this.getCurrentUser();
      if (!currentUser || !currentUser.userId) {
        throw new Error("User ID not found");
      }

      // First, try to get all leaves from the API
      const allLeavesResult = await this.getAllLeaveRequests();

      if (!allLeavesResult.success || !Array.isArray(allLeavesResult.data)) {
        console.log("No leaves data received or data is not an array");
        return {
          success: false,
          data: [],
          message: "No leave data available",
        };
      }

      console.log("All leaves from API:", allLeavesResult.data);
      console.log("Current user ID:", currentUser.userId);

      // Filter leaves by current user ID
      // We need to check different possible user ID fields in the leave data
      const userLeaves = allLeavesResult.data.filter((leave) => {
        // Check various possible user ID fields
        const isUserLeave =
          leave.userId === currentUser.userId ||
          leave.employeeId === currentUser.userId ||
          (leave.employee && leave.employee.userId === currentUser.userId) ||
          (leave.user && leave.user.userId === currentUser.userId) ||
          leave.appliedBy === currentUser.userId;

        console.log(`Leave ${leave.leaveRequestId || leave.id}:`, {
          leaveUserId: leave.userId,
          leaveEmployeeId: leave.employeeId,
          currentUserId: currentUser.userId,
          isUserLeave: isUserLeave,
        });

        return isUserLeave;
      });

      console.log("Filtered user leaves:", userLeaves);

      return {
        success: true,
        data: userLeaves,
        message: `Found ${userLeaves.length} leave requests`,
      };
    } catch (error) {
      console.error("Error fetching user leave requests:", error);
      return {
        success: false,
        data: [],
        message: error.message,
      };
    }
  }

  // Get leave balance for current user (SIMPLIFIED VERSION)
  async getUserLeaveBalance() {
    try {
      // First get user's approved leaves
      const userLeaves = await this.getUserLeaveRequests();

      if (!userLeaves.success || !Array.isArray(userLeaves.data)) {
        return {
          success: false,
          data:  await this.getDefaultLeaveBalance(),
          message: "Failed to fetch leave balance",
        };
      }

      // Get approved leaves for current year
      const currentYear = new Date().getFullYear();
      const approvedLeaves = userLeaves.data.filter(
        (leave) =>
          leave.status === "APPROVED" &&
          leave.startDate &&
          new Date(leave.startDate).getFullYear() === currentYear
      );

      // Count days for each leave type
      const leaveTypeCounts = {};


      approvedLeaves.forEach((leave) => {
        const leaveTypeId = leave.leaveTypeId || "default";
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (!leaveTypeCounts[leaveTypeId]) {
          leaveTypeCounts[leaveTypeId] = {
            typeName: leave.leaveTypeName || leave.leaveTypeId || "Leave",
            usedDays: 0,
            maxDays: 15, // Default max days
            leaveTypeId: leaveTypeId,
          };
        }
        leaveTypeCounts[leaveTypeId].usedDays += days;
      });

      // Convert to array and calculate remaining days
      const balance = Object.values(leaveTypeCounts).map((item) => ({
        ...item,
        remainingDays: Math.max(0, item.maxDays - item.usedDays),
      }));

      return {
        success: true,
        data: balance.length > 0 ? balance :  await this.getDefaultLeaveBalance(),
        message: "Leave balance calculated successfully",
      };
    } catch (error) {
      console.error("Error calculating leave balance:", error);
      return {
        success: false,
        data: await this.getDefaultLeaveBalance(),
        message: error.message,
      };
    }
  }

  // Helper method for default leave balance
  async getDefaultLeaveBalance() {

    const companyLeaveTypes = await this.GetComapnyLeaveTypes();
    if(!companyLeaveTypes){
        
        return [
          {
            typeName: "Annual Leave",
            usedDays: 0,
            maxDays: 15,
            remainingDays: 15,
            leaveTypeId: "annual",
          },
          {
            typeName: "Sick Leave",
            usedDays: 0,
            maxDays: 10,
            remainingDays: 10,
            leaveTypeId: "sick",
          },
          {
            typeName: "Casual Leave",
            usedDays: 0,
            maxDays: 7,
            remainingDays: 7,
            leaveTypeId: "casual",
          },
        ];
    }
    else{

        return companyLeaveTypes.data.map((type) => ({
          typeName: type.name || "Leave",
          usedDays: 0,
          maxDays: type.maxDaysPerYear || 15,
          leaveTypeId: type.leaveTypeId,
        }));
    }

  }
  // Get current user's employee details
  async getCurrentUserEmployeeDetails() {
    try {
      const employeeId = await this.getCurrentUserEmployeeId();
      if (!employeeId) {
        return null;
      }

      const result = await this.getEmployeeById(employeeId);
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("Error getting employee details:", error);
      return null;
    }
  }

  async createLeave(companyId, code, name, maxDaysPerYear, authToken) {
    try {
      // Verify admin access
      const tokenData = this.parseToken(authToken);
      if (!tokenData || tokenData.role !== "COMPANY_ADMIN") {
        return {
          success: false,
          status: 403,
          data: {
            message: "Access denied. Only admins can create leave types.",
          },
        };
      }

      const response = await fetch(`${this.leaveAPI}/createLeave`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${authToken}`,
          companyId: companyId,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          companyId: companyId,
          code: code,
          name: name,
          maxDaysPerYear: maxDaysPerYear,
        }),
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error creating leave:", error);
      throw error;
    }
  }

  async applyLeave(
    companyIdOrData,
    leaveTypeId,
    startDate,
    endDate,
    reason,
    authToken
  ) {
    try {
      // Support two call styles:
      // 1) applyLeave({ companyId, leaveTypeId, startDate, endDate, reason }, authToken)
      // 2) applyLeave(companyId, leaveTypeId, startDate, endDate, reason, authToken)
      let payload = {};
      let token = authToken;

      if (typeof companyIdOrData === "object" && companyIdOrData !== null) {
        payload = companyIdOrData;
        // token may be passed as second arg
        if (typeof leaveTypeId === "string") {
          token = leaveTypeId; // when called as (data, authToken)
        }
      } else {
        payload = {
          companyId: companyIdOrData,
          leaveTypeId,
          startDate,
          endDate,
          reason,
        };
      }

      // Default token/company from local storage if not provided
      if (!token) {
        token = this.getToken();
      }

      if (!payload.companyId) {
        payload.companyId = this.getCompanyId();
      }

      // Verify user is authenticated
      const tokenToParse =
        typeof token === "string" && token.startsWith("Bearer ")
          ? token.slice(7)
          : token;
      const tokenData = this.parseToken(tokenToParse);
      if (!tokenData) {
        return {
          success: false,
          status: 401,
          data: { message: "Unauthorized. Invalid or expired token." },
        };
      }

      // Ensure employeeId is included in the payload
      if (!payload.employeeId) {
        payload.employeeId =
          tokenData.employeeId ||
          tokenData.employeeID ||
          tokenData.employee ||
          null;
        if (!payload.employeeId) {
          // Try to derive employeeId from current user record
          payload.employeeId = await this.getCurrentUserEmployeeId();
        }
      }

      const response = await fetch(`${this.leaveAPI}/applyLeave`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${tokenToParse}`,
          companyId: payload.companyId,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error applying leave:", error);
      throw error;
    }
  }

  async getLeaveTypes(companyId, authToken) {
    try {
      // Default to stored company/token when not provided
      let company = companyId || this.getCompanyId();
      let token = authToken || this.getToken();

      let tokenToParse = token;
      if (typeof token === "string" && token.startsWith("Bearer ")) {
        tokenToParse = token.slice(7);
      }

      const tokenData = this.parseToken(tokenToParse);
      if (!tokenData) {
        return {
          success: false,
          status: 401,
          data: { message: "Unauthorized. Invalid or expired token." },
        };
      }

      const response = await fetch(`${this.leaveAPI}/`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${tokenToParse}`,
          companyId: company,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const data = await response.json();

      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching leave types:", error);
      throw error;
    }
  }

  // Fetch leave balances from backend for a given employee
  async getLeaveBalance(companyId, employeeId, authToken) {
    try {
      const company = companyId || this.getCompanyId();
      const token = authToken || this.getToken();

      let tokenToParse = token;
      if (typeof token === "string" && token.startsWith("Bearer "))
        tokenToParse = token.slice(7);

      const tokenData = this.parseToken(tokenToParse);

      // determine employee id: explicit -> token -> localStorage/current user lookup
      let eid =
        employeeId ||
        (tokenData &&
          (tokenData.employeeId || tokenData.employeeID || tokenData.employee));
      if (!eid) eid = await this.getCurrentUserEmployeeId();

      if (!eid) {
        // Fallback to client-side calculation if we cannot determine employee
        return this.getUserLeaveBalance();
      }

      // Do NOT call `/leave/balance` — use admin-derived calculation when caller is admin
      if (tokenData && tokenData.role === "COMPANY_ADMIN") {
        return await this.getLeaveBalanceFromAllRequests(
          company,
          eid,
          tokenToParse
        );
      }

      // For non-admin users, compute balance from client-side data
      return this.getUserLeaveBalance();
    } catch (error) {
      console.error("Error fetching leave balance:", error);
      return this.getUserLeaveBalance();
    }
  }

  // Admin: Get all leave requests for the company
  async getAllLeaveRequestsAdmin(companyId, authToken) {
    try {
      const company = companyId || this.getCompanyId();
      let token = authToken || this.getToken();
      if (typeof token === "string" && token.startsWith("Bearer "))
        token = token.slice(7);

      const tokenData = this.parseToken(token);
      if (!tokenData || tokenData.role !== "COMPANY_ADMIN") {
        return {
          success: false,
          status: 403,
          data: {
            message: "Access denied. Only admins can list all leave requests.",
          },
        };
      }

      const url = `${
        this.leaveAPI
      }/allLeaveRequest?companyId=${encodeURIComponent(company)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
          companyId: company,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching all leave requests:", error);
      throw error;
    }
  }

  // Public: fetch all leave requests for a company without enforcing client-side admin role check
  // Note: server may still reject non-admin tokens; this method simply does not perform a role check client-side
  async getAllLeavesOpen(companyId, authToken) {
    try {
      const company = companyId || this.getCompanyId();
      let token = authToken || this.getToken();
      if (typeof token === "string" && token.startsWith("Bearer "))
        token = token.slice(7);

      const url = `${
        this.leaveAPI
      }/allLeaveRequest?companyId=${encodeURIComponent(company)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
          companyId: company,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching all leaves (open):", error);
      return { success: false, data: [], message: error.message };
    }
  }

  // Admin: Approve / Reject / Update leave status
  async approveLeave(leaveRequestId, status, authToken) {
    try {
      if (!leaveRequestId || !status) {
        return {
          success: false,
          status: 400,
          data: { message: "leaveRequestId and status are required" },
        };
      }

      let token = authToken || this.getToken();
      if (typeof token === "string" && token.startsWith("Bearer "))
        token = token.slice(7);

      const tokenData = this.parseToken(token);
      if (!tokenData || tokenData.role !== "COMPANY_ADMIN") {
        return {
          success: false,
          status: 403,
          data: {
            message: "Access denied. Only admins can approve leave requests.",
          },
        };
      }

      const response = await fetch(`${this.leaveAPI}/updateLeave`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          leaveRequestId: leaveRequestId,
          status: status,
        }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data: data,
      };
    } catch (error) {
      console.error("Error approving leave request:", error);
      throw error;
    }
  }

  // Generic update status wrapper (keeps naming clearer)
  async updateLeaveStatus(leaveRequestId, status, authToken) {
    // Delegate to approveLeave which performs role checks and sends the request
    return this.approveLeave(leaveRequestId, status, authToken);
  }

  // Unified method: return leave requests appropriate to the caller
  async getLeaveRequests(companyId, authToken) {
    try {
      let token = authToken || this.getToken();
      let tokenToParse = token;
      if (typeof token === "string" && token.startsWith("Bearer "))
        tokenToParse = token.slice(7);

      const tokenData = this.parseToken(tokenToParse);
      // Fetch all leaves from the open admin endpoint (server may still enforce auth)
      const allRes = await this.getAllLeavesOpen(companyId, tokenToParse);
      if (!allRes || !allRes.success || !Array.isArray(allRes.data)) {
        // If the open fetch failed, fall back to user-specific leaves
        return this.getUserLeaveRequests();
      }

      // If caller is admin, return all leaves; otherwise filter to leaves applied by current user
      if (tokenData && tokenData.role === "COMPANY_ADMIN") {
        return allRes;
      }

      const currentUserId = this.getCurrentUser()?.userId;
      if (!currentUserId)
        return { success: false, data: [], message: "User not authenticated" };

      const filtered = allRes.data.filter((leave) => {
        return (
          String(leave.userId) === String(currentUserId) ||
          String(leave.employeeId) === String(currentUserId) ||
          (leave.employee &&
            (String(leave.employee.userId) === String(currentUserId) ||
              String(leave.employee.id) === String(currentUserId))) ||
          (leave.requestedBy &&
            String(leave.requestedBy) === String(currentUserId)) ||
          leave.requestedBy === currentUserId
        );
      });

      return { success: true, status: allRes.status, data: filtered };
    } catch (error) {
      console.error("Error in getLeaveRequests:", error);
      return { success: false, data: [], message: error.message };
    }
  }

  // Get summary of a user's leaves and compute totals (incl. CL/EL aggregates)
  // If caller is admin, uses the admin allLeaveRequest endpoint; otherwise falls back to user-specific requests
  async getUserLeaveSummary(companyId, userId, authToken) {
    try {
      const company = companyId || this.getCompanyId();
      let token = authToken || this.getToken();
      let tokenToParse = token;
      if (typeof token === "string" && token.startsWith("Bearer "))
        tokenToParse = token.slice(7);

      // Determine target user id (default to currently logged in user)
      const targetUserId = userId || this.getCurrentUser()?.userId;
      if (!targetUserId) {
        return {
          success: false,
          data: null,
          message: "No user id provided or logged in user not found",
        };
      }

      // Fetch leaves: prefer admin all-leaves when available
      let leaves = [];
      const tokenData = this.parseToken(tokenToParse);
      if (tokenData && tokenData.role === "COMPANY_ADMIN") {
        const allRes = await this.getAllLeaveRequestsAdmin(
          company,
          tokenToParse
        );
        if (allRes && allRes.success && Array.isArray(allRes.data))
          leaves = allRes.data;
      } else {
        const userRes = await this.getUserLeaveRequests();
        if (userRes && userRes.success && Array.isArray(userRes.data))
          leaves = userRes.data;
      }

      // Filter leaves applied by the target user (handles different shapes)
      const userLeaves = leaves.filter((leave) => {
        return (
          String(leave.userId) === String(targetUserId) ||
          String(leave.employeeId) === String(targetUserId) ||
          (leave.employee &&
            (String(leave.employee.userId) === String(targetUserId) ||
              String(leave.employee.id) === String(targetUserId))) ||
          (leave.appliedBy && String(leave.appliedBy) === String(targetUserId))
        );
      });

      // Get leave types to read entitlements (maxDaysPerYear) when available
      const typesRes = await this.getLeaveTypes(company, tokenToParse);
      const types =
        typesRes && typesRes.success && Array.isArray(typesRes.data)
          ? typesRes.data
          : [];
      const typeMap = {};
      types.forEach((t) => {
        const key = (t.name || t.code || t.id || "").toString().toLowerCase();
        typeMap[key] = t;
      });

      // Helper: normalize a leave's type key
      const getTypeKey = (leave) => {
        if (!leave) return "unknown";
        const name = (
          leave.leaveTypeName ||
          (leave.leaveType && (leave.leaveType.name || leave.leaveTypeId)) ||
          leave.leaveTypeId ||
          leave.code ||
          ""
        ).toString();
        return name.toLowerCase();
      };

      // Accumulate usage per type
      const summaryMap = {};
      userLeaves.forEach((leave) => {
        const key = getTypeKey(leave) || "unknown";
        if (!summaryMap[key]) {
          // Determine total entitlement from leave types if possible
          const t = typeMap[key];
          const total = t ? t.maxDaysPerYear || t.maxDays || 0 : 0;
          summaryMap[key] = {
            typeName: t?.name || leave.leaveTypeName || key,
            totalDays: total,
            usedDays: 0,
            remainingDays: total,
          };
        }

        // Only count approved leaves as used
        if (leave.status === "APPROVED") {
          const start = leave.startDate
            ? new Date(leave.startDate)
            : leave.createdAt
            ? new Date(leave.createdAt)
            : null;
          const end = leave.endDate ? new Date(leave.endDate) : start;
          if (start && end) {
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            summaryMap[key].usedDays += days;
            summaryMap[key].remainingDays = Math.max(
              0,
              summaryMap[key].totalDays - summaryMap[key].usedDays
            );
          }
        }
      });

      // Compute CL and EL aggregates (common naming variations)
      const aggregate = {
        CL: { total: 0, used: 0, remaining: 0 },
        EL: { total: 0, used: 0, remaining: 0 },
      };

      Object.keys(summaryMap).forEach((k) => {
        const item = summaryMap[k];
        const name = (item.typeName || k).toLowerCase();
        // Identify CL (Casual Leave) and EL (Earned/Annual Leave) by name
        if (
          name.includes("casual") ||
          name === "cl" ||
          name.includes("c l") ||
          name.includes("cas")
        ) {
          aggregate.CL.total += item.totalDays || 0;
          aggregate.CL.used += item.usedDays || 0;
          aggregate.CL.remaining = Math.max(
            0,
            aggregate.CL.total - aggregate.CL.used
          );
        } else if (
          name.includes("earn") ||
          name.includes("annual") ||
          name === "el" ||
          name.includes("el ")
        ) {
          aggregate.EL.total += item.totalDays || 0;
          aggregate.EL.used += item.usedDays || 0;
          aggregate.EL.remaining = Math.max(
            0,
            aggregate.EL.total - aggregate.EL.used
          );
        }
      });

      return {
        success: true,
        data: {
          userId: targetUserId,
          leaves: userLeaves,
          perType: Object.values(summaryMap),
          aggregates: aggregate,
        },
      };
    } catch (error) {
      console.error("Error computing user leave summary:", error);
      return { success: false, data: null, message: error.message };
    }
  }
}
// Create global auth instance
const authAPI = new AuthAPI();

var options = {
  method: 'GET',
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/assets',
  headers: {
    authorization: 'Bearer <YOUR_TOKEN>',
    companyId: '036e971a-31aa-43ab-b900-764ef88abf6b',
    'ngrok-skip-browser-warning': 'true'
  },
  maxRedirects: 20
};
