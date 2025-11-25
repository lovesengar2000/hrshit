// Dashboard functionality
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

        this.bindEvents();
        this.loadUserData();
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userEmail = document.getElementById('userEmail');
        this.userDetails = document.getElementById('userDetails');

        this.logoutBtn.addEventListener('click', () => {
            authAPI.logout();
        });
    }

    loadUserData() {
        const user = authAPI.getCurrentUser();
        
        if (user) {
            // Display user email in navbar
            this.userEmail.textContent = user.email;
            
            // Display user details
            this.userDetails.innerHTML = `
                <div class="user-detail-item">
                    <span class="user-detail-label">User ID:</span>
                    <span class="user-detail-value">${user.userId}</span>
                </div>
                <div class="user-detail-item">
                    <span class="user-detail-label">Email:</span>
                    <span class="user-detail-value">${user.email}</span>
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});