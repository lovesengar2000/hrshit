// Authentication API functions
class AuthAPI {
    constructor() {
        this.API_BASE_URL = 'https://corey-unhypnotizable-sippingly.ngrok-free.dev/api/v1/auth';
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
}

// Create global auth instance
const authAPI = new AuthAPI();