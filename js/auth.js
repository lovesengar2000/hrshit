// Authentication API functions
class AuthAPI {
    constructor() {
        this.API_BASE_URL = 'https://corey-unhypnotizable-sippingly.ngrok-free.dev/api/v1/auth';
        this.EMPLOYEES_API = 'https://corey-unhypnotizable-sippingly.ngrok-free.dev/api/v1';
        this.BASE_URL = 'https://corey-unhypnotizable-sippingly.ngrok-free.dev/api/v1';
    }


    async checkEmail(email) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/checkEmail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            console.log('Check Email Response:', data); // Debug log
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error checking email:', error);
            throw error;
        }
    }
    parseToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }


    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    }

    async register(companyName, domain, adminEmail, adminPassword) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    companyName,
                    domain,
                    adminEmail,
                    adminPassword
                })
            });
            
            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error during registration:', error);
            throw error;
        }
    }

    async registerEmployee(OTPCode, email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/registerEmployee`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    OTPCode: parseInt(OTPCode),
                    email,
                    password
                })
            });
            
            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error during employee registration:', error);
            throw error;
        }
    }

    // Utility function to check if user is authenticated
    isAuthenticated() {
        return localStorage.getItem('token') !== null;
    }

    // Get current user data
    getCurrentUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }

    // Get authentication token
    getToken() {
        return localStorage.getItem('token');
    }

    // Logout function
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    isValidPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    // Validate OTP code (6 digits)
    isValidOTP(otp) {
        const otpRegex = /^\d{6}$/;
        return otpRegex.test(otp);
    }
    getUserRole() {
        // First check localStorage
        const storedRole = localStorage.getItem('userRole');
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
            if (userData.email && userData.email.includes('admin')) {
                return 'COMPANY_ADMIN';
            }
        }
        
        // Default to regular user
        return 'EMPLOYEE';
    }

    // Check if user is admin
    isAdmin() {
        const role = this.getUserRole();
        return role === 'COMPANY_ADMIN';
    }

    // Check if user is regular user/employee
    isUser() {
        const role = this.getUserRole();
        return role !== 'COMPANY_ADMIN';
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
                throw new Error('No authentication token found');
            }

            console.log('Adding employee:', employeeData);
            console.log('Using token:', token.substring(0, 20) + '...');

            const response = await fetch(`${this.EMPLOYEES_API}/employees`, {
                method: 'POST',
                headers: {
                    'Authorization': `JWT ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(employeeData)
            });
            
            console.log('Add employee response status:', response.status);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }
            
            const data = await response.json();
            console.log('Add employee response:', data);
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error adding employee:', error);
            throw error;
        }
    }

    // Get all employees for a company (Admin only)
    async getEmployees(companyId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching employees for company:', companyId);
            console.log('Using token:', token.substring(0, 20) + '...');

            const response = await fetch(`${this.EMPLOYEES_API}/employees?companyId=${companyId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `JWT ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }
            
            const data = await response.json();
            console.log('Employees data received:', data);
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error fetching employees:', error);
            throw error;
        }
    }
    async getEmployeeById(employeeId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.EMPLOYEES_API}/employees/${employeeId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `JWT ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error fetching employee:', error);
            throw error;
        }
    }
    async updateEmployee(employeeId, employeeData) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.EMPLOYEES_API}/employees/${employeeId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `JWT ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(employeeData)
            });
            
            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error updating employee:', error);
            throw error;
        }
    }
    async deleteEmployee(employeeId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.EMPLOYEES_API}/employees/${employeeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `JWT ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error deleting employee:', error);
            throw error;
        }
    }
    async updateEmployeeDetails(employeeId, employeeData) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const companyId = this.getCompanyId();
            if (!companyId) {
                throw new Error('No company ID found');
            }

            console.log('Updating employee:', employeeId, employeeData);

            const response = await fetch(`${this.EMPLOYEES_API}/employees`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'companyId': companyId,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    ...employeeData,
                    employeeId: employeeId
                })
            });
            
            console.log('Update employee response status:', response.status);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }
            
            const data = await response.json();
            console.log('Update employee response:', data);
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error updating employee details:', error);
            throw error;
        }
    }

    // Get employee attendance records
    async getEmployeeAttendance(employeeId, startDate, endDate) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            let url = `${this.BASE_URL}/attendance/employee/${employeeId}`;
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error fetching attendance:', error);
            throw error;
        }
    }

    // Clock in
    async clockIn(companyId, employeeId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Clocking in:', { companyId, employeeId });

            const response = await fetch(`${this.BASE_URL}/attendance/clockin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    companyId,
                    employeeId
                    // Location removed as per API requirement
                })
            });
            
            console.log('Clock in response status:', response.status);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }
            
            const data = await response.json();
            console.log('Clock in response:', data);
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error clocking in:', error);
            throw error;
        }
    }

    // Clock out (without location)
    async clockOut(companyId, employeeId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Clocking out:', { companyId, employeeId });

            const response = await fetch(`${this.BASE_URL}/attendance/clockout`, {
                method: 'POST',
                headers: {
                    'Authorization': `JWT ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    companyId,
                    employeeId
                    // Location removed as per API requirement
                })
            });
            
            console.log('Clock out response status:', response.status);
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
            }
            
            const data = await response.json();
            console.log('Clock out response:', data);
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error clocking out:', error);
            throw error;
        }
    }

    // Get today's attendance status
    async getTodayAttendance(employeeId) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`${this.BASE_URL}/attendance/today/${employeeId}?date=${today}`, {
                method: 'GET',
                headers: {
                    'Authorization': `JWT ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error fetching today\'s attendance:', error);
            throw error;
        }
    }

    // Get current user's employee ID
    async getCurrentUserEmployeeId() {
        try {
            const user = this.getCurrentUser();
            console.log('Current user:', user); // Debug log
            
            // First, check if employeeId is directly in user object
            if (user && user.employeeId) {
                return user.employeeId;
            }
            
            // Check if profileEmployeeId exists
            if (user && user.profileEmployeeId) {
                return user.profileEmployeeId;
            }
            
            // Check if userId can be used as employeeId (some systems use same ID)
            if (user && user.userId) {
                // Try to fetch employee by userId
                const companyId = this.getCompanyId();
                if (companyId) {
                    const employees = await this.getEmployeesByUserId(companyId, user.userId);
                    if (employees && employees.length > 0) {
                        return employees[0].employeeId;
                    }
                }
            }
            
            // If not found, fetch from employees API using email
            const companyId = this.getCompanyId();
            if (!companyId) {
                console.error('No company ID found');
                return null;
            }

            console.log('Fetching employees for company:', companyId);
            const result = await this.getEmployees(companyId);
            
            if (result.success && result.data && Array.isArray(result.data)) {
                const employees = result.data;
                console.log('Employees found:', employees.length);
                
                // Try to find employee by email
                const currentUser = employees.find(emp => {
                    // Check email match
                    if (emp.email && user.email && emp.email.toLowerCase() === user.email.toLowerCase()) {
                        return true;
                    }
                    // Check username match
                    if (emp.username && user.username && emp.username.toLowerCase() === user.username.toLowerCase()) {
                        return true;
                    }
                    // Check if userId matches
                    if (emp.userId && user.userId && emp.userId === user.userId) {
                        return true;
                    }
                    return false;
                });
                
                if (currentUser) {
                    console.log('Found employee:', currentUser);
                    return currentUser.employeeId || currentUser.id;
                } else {
                    console.log('No matching employee found. Available employees:', employees.map(e => ({ 
                        email: e.email, 
                        username: e.username, 
                        userId: e.userId,
                        employeeId: e.employeeId 
                    })));
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting employee ID:', error);
            return null;
        }
    }

    // Helper method to get employees by userId
    async getEmployeesByUserId(companyId, userId) {
        try {
            const result = await this.getEmployees(companyId);
            if (result.success && result.data && Array.isArray(result.data)) {
                return result.data.filter(emp => emp.userId === userId);
            }
            return [];
        } catch (error) {
            console.error('Error getting employees by userId:', error);
            return [];
        }
    }
    
    async getEmployeeEvents(companyId, employeeId, startDate = null, endDate = null) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const requestBody = {
                companyId,
                employeeId
            };
            
            if (startDate) requestBody.startDate = startDate;
            if (endDate) requestBody.endDate = endDate;

            console.log('Fetching employee events with:', requestBody);

            const response = await fetch(`${this.BASE_URL}/attendance/getEmployeeEvents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('Get employee events response status:', response.status);
            
            if (!response.ok) {
                console.error('API error:', response.status, response.statusText);
                return {
                    success: false,
                    status: response.status,
                    data: null
                };
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                return {
                    success: false,
                    status: response.status,
                    data: { message: 'Invalid response format' }
                };
            }
            
            const data = await response.json();
            console.log('Employee events data received:', data);
            
            return {
                success: true,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Error getting employee events:', error);
            return {
                success: false,
                status: 0,
                data: { message: error.message }
            };
        }
    }

    // Get today's attendance status from events
    async getTodayAttendanceFromEvents(companyId, employeeId) {
        try {
            console.log('Getting today\'s attendance for:', { companyId, employeeId });
            
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            
            console.log('Date range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());
            
            const result = await this.getEmployeeEvents(
                companyId, 
                employeeId, 
                startOfDay.toISOString(), 
                endOfDay.toISOString()
            );
            
            console.log('Today\'s events result:', result);
            
            if (result.success && Array.isArray(result.data)) {
                const todayEvents = result.data;
                console.log('Today events found:', todayEvents.length);
                
                if (todayEvents.length === 0) {
                    return {
                        clockInTime: null,
                        clockOutTime: null,
                        events: []
                    };
                }
                
                // Sort events by time (descending - newest first)
                todayEvents.sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
                
                // Find the latest CLOCK_IN and CLOCK_OUT
                let clockInEvent = null;
                let clockOutEvent = null;
                
                // Process events to find proper pairs
                const eventsByType = {
                    CLOCK_IN: [],
                    CLOCK_OUT: []
                };
                
                todayEvents.forEach(event => {
                    if (event.eventType === 'CLOCK_IN') {
                        eventsByType.CLOCK_IN.push(event);
                    } else if (event.eventType === 'CLOCK_OUT') {
                        eventsByType.CLOCK_OUT.push(event);
                    }
                });
                
                // Sort each type by time (newest first)
                eventsByType.CLOCK_IN.sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
                eventsByType.CLOCK_OUT.sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
                
                // Get the latest of each type
                clockInEvent = eventsByType.CLOCK_IN[0] || null;
                clockOutEvent = eventsByType.CLOCK_OUT[0] || null;
                
                console.log('Latest events:', { clockInEvent, clockOutEvent });
                
                return {
                    clockInTime: clockInEvent ? clockInEvent.eventTime : null,
                    clockOutTime: clockOutEvent ? clockOutEvent.eventTime : null,
                    clockInEvent: clockInEvent,
                    clockOutEvent: clockOutEvent,
                    events: todayEvents,
                    allClockIns: eventsByType.CLOCK_IN,
                    allClockOuts: eventsByType.CLOCK_OUT
                };
            }
            
            console.log('No events array found in response');
            return {
                clockInTime: null,
                clockOutTime: null,
                events: []
            };
        } catch (error) {
            console.error('Error getting today\'s attendance from events:', error);
            return {
                clockInTime: null,
                clockOutTime: null,
                events: []
            };
        }
    }

    // Get attendance summary for period
    async getAttendanceSummary(companyId, employeeId, startDate, endDate) {
        try {
            console.log('Getting attendance summary for:', { companyId, employeeId, startDate, endDate });
            
            const result = await this.getEmployeeEvents(companyId, employeeId, startDate, endDate);
            
            if (result.success && Array.isArray(result.data)) {
                const events = result.data;
                console.log('Total events found:', events.length);
                
                // Group events by date
                const eventsByDate = {};
                events.forEach(event => {
                    const date = new Date(event.eventTime).toISOString().split('T')[0];
                    if (!eventsByDate[date]) {
                        eventsByDate[date] = [];
                    }
                    eventsByDate[date].push(event);
                });
                
                console.log('Events grouped by date:', Object.keys(eventsByDate).length);
                
                // Process each day's events
                const dailySummaries = [];
                Object.keys(eventsByDate).forEach(date => {
                    const dayEvents = eventsByDate[date];
                    console.log(`Processing ${date}: ${dayEvents.length} events`);
                    
                    // Sort events by time (ascending)
                    dayEvents.sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));
                    
                    // Find pairs of CLOCK_IN and CLOCK_OUT
                    let clockInTime = null;
                    let clockOutTime = null;
                    let totalHours = 0;
                    let lastClockIn = null;
                    
                    // Process events in chronological order
                    for (const event of dayEvents) {
                        if (event.eventType === 'CLOCK_IN') {
                            lastClockIn = new Date(event.eventTime);
                            clockInTime = event.eventTime;
                        } else if (event.eventType === 'CLOCK_OUT' && lastClockIn) {
                            const clockOut = new Date(event.eventTime);
                            totalHours += (clockOut - lastClockIn) / (1000 * 60 * 60);
                            clockOutTime = event.eventTime;
                            lastClockIn = null; // Reset for next pair
                        }
                    }
                    
                    // Determine status
                    let status = 'PENDING';
                    if (lastClockIn) {
                        status = 'IN_PROGRESS'; // Clocked in but not out
                    } else if (totalHours > 0) {
                        status = 'COMPLETED';
                    }
                    
                    dailySummaries.push({
                        date,
                        clockInTime,
                        clockOutTime,
                        hoursWorked: totalHours.toFixed(2),
                        status,
                        eventCount: dayEvents.length,
                        firstEventTime: dayEvents[0]?.eventTime,
                        lastEventTime: dayEvents[dayEvents.length - 1]?.eventTime
                    });
                });
                
                // Sort by date descending
                dailySummaries.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                console.log('Daily summaries created:', dailySummaries.length);
                return dailySummaries;
            }
            
            console.log('No events data for summary');
            return [];
        } catch (error) {
            console.error('Error getting attendance summary:', error);
            return [];
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
            console.error('Error getting employee details:', error);
            return null;
        }
    }
}

// Create global auth instance
const authAPI = new AuthAPI();