// Dashboard functionality for regular users
class Dashboard {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication
        if (!authAPI.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Redirect admin users to admin dashboard
        if (authAPI.isAdmin()) {
            window.location.href = 'admin-dashboard.html';
            return;
        }

        this.bindEvents();
        this.loadUserData();
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userEmail = document.getElementById('userEmail');
        this.userProfile = document.getElementById('userProfile');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.attendanceBtn = document.getElementById('attendanceBtn');
        if (this.attendanceBtn) {
            this.attendanceBtn.addEventListener('click', () => {
                window.location.href = 'attendance.html';
            });
        }

        this.logoutBtn.addEventListener('click', () => {
            authAPI.logout();
        });
    }

    loadUserData() {
        const user = authAPI.getCurrentUser();
        const role = authAPI.getUserRole();

        if (user) {
            // Display user email in navbar
            this.userEmail.textContent = user.email;

            // Update welcome message based on role
            if (this.welcomeMessage) {
                if (role === 'EMPLOYEE') {
                    this.welcomeMessage.textContent = 'You\'re logged in as an employee.';
                } else {
                    this.welcomeMessage.textContent = `You're logged in as ${role.toLowerCase().replace('_', ' ')}.`;
                }
            }

            // Display user profile details
            if (this.userProfile) {
                this.userProfile.innerHTML = `
                    <div class="user-detail-item">
                        <span class="user-detail-label">Name:</span>
                        <span class="user-detail-value">${user.username || user.email.split('@')[0]}</span>
                    </div>
                    <div class="user-detail-item">
                        <span class="user-detail-label">Email:</span>
                        <span class="user-detail-value">${user.email}</span>
                    </div>
                    <div class="user-detail-item">
                        <span class="user-detail-label">User ID:</span>
                        <span class="user-detail-value">${user.userId}</span>
                    </div>
                    <div class="user-detail-item">
                        <span class="user-detail-label">Company ID:</span>
                        <span class="user-detail-value">${user.companyId}</span>
                    </div>
                    <div class="user-detail-item">
                        <span class="user-detail-label">Account Created:</span>
                        <span class="user-detail-value">${new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="user-detail-item">
                        <span class="user-detail-label">Status:</span>
                        <span class="user-detail-value">${user.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                `;
            }
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});