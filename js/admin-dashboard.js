// Admin Dashboard functionality
class AdminDashboard {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication and admin role
        if (!authAPI.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // More robust admin check
        const role = authAPI.getUserRole();
        console.log('User role:', role); // Debug log
        
        if (role !== 'COMPANY_ADMIN') {
            console.log('User is not admin, redirecting to regular dashboard');
            window.location.href = 'dashboard.html';
            return;
        }

        this.bindEvents();
        this.loadUserData();
        this.loadEmployeeStats();
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.manageUsersBtn = document.getElementById('manageUsersBtn');
        this.addUserBtn = document.getElementById('addUserBtn');
        this.viewUsersBtn = document.getElementById('viewUsersBtn');
        this.reportsBtn = document.getElementById('reportsBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.userEmail = document.getElementById('userEmail');
        this.addUserForm = document.getElementById('addUserForm');
        this.manageLeaveBtn = document.getElementById('manageLeaveBtn');
        this.manageAssetsBtn = document.getElementById('manageAssetsBtn');
        
        // Modal elements
        this.modal = document.getElementById('addUserModal');
        this.closeModalBtns = document.querySelectorAll('.close-modal');

        this.logoutBtn.addEventListener('click', () => authAPI.logout());
        this.manageUsersBtn.addEventListener('click', () => this.goToManageUsers());
        this.addUserBtn.addEventListener('click', () => this.showAddUserModal());
        this.viewUsersBtn.addEventListener('click', () => this.viewAllEmployees());
        this.reportsBtn.addEventListener('click', () => this.generateReports());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.manageLeaveBtn.addEventListener('click', () => this.goToManageLeave());
        this.manageAssetsBtn.addEventListener('click', () => this.goToManageAssets());
        // Add user form submission
        if (this.addUserForm) {
            this.addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
        }

        // Modal close events
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    loadUserData() {
        const user = authAPI.getCurrentUser();
        
        if (user) {
            this.userEmail.textContent = user.email;
        }
    }

    async loadEmployeeStats() {
        try {
            const companyId = authAPI.getCompanyId();
            if (!companyId) {
                console.error('No company ID found');
                return;
            }

            console.log('Loading employees for company:', companyId);
            
            const result = await authAPI.getEmployees(companyId);
            
            if (result.success && result.data) {
                const employees = Array.isArray(result.data) ? result.data : [];
                console.log('Employees loaded:', employees.length);
                
                document.getElementById('totalEmployees').textContent = employees.length;
                
                // Count active users
                const activeUsers = employees.filter(emp => emp.isActive !== false).length;
                document.getElementById('activeUsers').textContent = activeUsers;
                
                // Count pending invites (employees without userId or not active)
                const pendingInvites = employees.filter(emp => !emp.userId || emp.isActive === false).length;
                document.getElementById('pendingInvites').textContent = pendingInvites;
                
                // Update recent activity
                this.updateRecentActivity(employees);
            } else {
                console.error('Failed to load employees:', result);
                this.showStatsError();
            }
        } catch (error) {
            console.error('Error loading employee stats:', error);
            this.showStatsError();
        }
    }
    
    showStatsError() {
        document.getElementById('totalEmployees').textContent = 'Error';
        document.getElementById('activeUsers').textContent = 'Error';
        document.getElementById('pendingInvites').textContent = 'Error';
    }

    updateRecentActivity(employees) {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        if (employees.length === 0) {
            activityList.innerHTML = '<p>No employees found</p>';
            return;
        }

        // Sort by creation date (newest first)
        const sortedEmployees = [...employees].sort((a, b) => {
            return new Date(b.createdAt || b.hireDate || 0) - new Date(a.createdAt || a.hireDate || 0);
        });

        // Show recent 5 employees
        const recentEmployees = sortedEmployees.slice(0, 5);
        activityList.innerHTML = recentEmployees.map(emp => `
            <div class="activity-item">
                <div class="activity-icon">${emp.userId ? '👤' : '📧'}</div>
                <div class="activity-details">
                    <strong>${emp.firstName || ''} ${emp.lastName || ''}</strong>
                    <span class="activity-text">${emp.email || 'No email'}</span>
                    <span class="activity-time">
                        ${emp.userId ? 'Registered' : 'Invite Sent'} • 
                        ${emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 
                          emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 'Recently'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    goToManageUsers() {
        window.location.href = 'manage-users.html';
    }
    goToManageLeave() {
        window.location.href = 'manage-leave.html';
    }

    goToManageAssets() {
        window.location.href = 'manage-assets.html';
    }   

    showAddUserModal() {
        if (this.modal) {
            this.modal.style.display = 'block';
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.addUserForm.reset();
        }
    }

    async handleAddUser(e) {
        e.preventDefault();
        
        const companyId = authAPI.getCompanyId();
        if (!companyId) {
            alert('No company ID found. Please log in again.');
            return;
        }

        const employeeData = {
            companyId: companyId,
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('employeeEmail').value.trim(),
            phoneMobile: document.getElementById('phoneMobile').value.trim(),
            gender: document.getElementById('gender').value,
            hireDate: document.getElementById('hireDate').value
        };

        // Validate
        if (!employeeData.firstName || !employeeData.lastName || !employeeData.email) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            const result = await authAPI.addEmployee(employeeData);
            
            if (result.success) {
                alert('Employee added successfully! An OTP will be sent to their email for registration.');
                this.closeModal();
                this.loadEmployeeStats(); // Refresh stats
            } else {
                alert(`Failed to add employee: ${result.data.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error adding employee:', error);
            alert('Error adding employee. Please try again.');
        }
    }

    viewAllEmployees() {
        this.goToManageUsers();
    }

    generateReports() {
        // Implement report generation
        alert('Report generation feature coming soon!');
    }

    showSettings() {
        // Implement settings
        alert('Settings feature coming soon!');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});