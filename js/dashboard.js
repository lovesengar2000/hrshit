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
        this.loadUserLeaves();
        this.loadLeaveBalance();
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userEmail = document.getElementById('userEmail');
        this.userProfile = document.getElementById('userProfile');
        this.welcomeMessage = document.getElementById('welcomeMessage');
        this.attendanceBtn = document.getElementById('attendanceBtn');
        this.applyLeaveBtn = document.getElementById('applyLeaveBtn');
        this.viewMyLeavesBtn = document.getElementById('viewMyLeavesBtn');
        this.viewAssetsBtn = document.getElementById('viewAssetsBtn');
        
        // Add event listeners
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => {
                authAPI.logout();
            });
        }
        
        if (this.attendanceBtn) {
            this.attendanceBtn.addEventListener('click', () => {
                window.location.href = 'attendance.html';
            });
        }
        
        if (this.applyLeaveBtn) {
            this.applyLeaveBtn.addEventListener('click', () => this.goToApplyLeave());
        }
        
        if (this.viewMyLeavesBtn) {
            this.viewMyLeavesBtn.addEventListener('click', () => this.viewMyLeaves());
        }
        
        if (this.viewAssetsBtn) {
            this.viewAssetsBtn.addEventListener('click', () => this.viewAssets());
        }
    }

    goToApplyLeave() {
        window.location.href = 'apply-leave.html';
    }

    async viewMyLeaves() {
        try {
            const result = await authAPI.getUserLeaveRequests();
            
            if (result.success && result.data && Array.isArray(result.data)) {
                this.showAllLeavesModal(result.data);
            } else {
                alert('No leave requests found.');
            }
        } catch (error) {
            console.error('Error viewing leaves:', error);
            alert('Error loading leave requests. Please try again.');
        }
    }

    viewAssets() {
        // This would show assets assigned to the user
        alert('Asset viewing feature coming soon!');
    }

    async loadUserLeaves() {
        try {
            const result = await authAPI.getUserLeaveRequests();
            
            if (result.success && result.data && Array.isArray(result.data)) {
                this.displayUserLeaves(result.data);
            } else {
                this.displayNoLeaves();
            }
        } catch (error) {
            console.error('Error loading user leaves:', error);
            this.displayNoLeaves();
        }
    }

    displayUserLeaves(leaves) {
        const leavesContainer = document.getElementById('userLeaves');
        if (!leavesContainer) return;

        if (leaves.length === 0) {
            this.displayNoLeaves();
            return;
        }

        // Sort by date (newest first)
        const sortedLeaves = [...leaves].sort((a, b) => 
            new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt)
        );

        // Show only recent 3 leaves
        const recentLeaves = sortedLeaves.slice(0, 3);
        
        leavesContainer.innerHTML = `
            <div class="leaves-list">
                ${recentLeaves.map(leave => {
                    const startDate = leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A';
                    const endDate = leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A';
                    const appliedOn = leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : 'N/A';
                    const days = leave.startDate && leave.endDate ? 
                        Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 
                        0;
                    
                    // Determine status badge class
                    let statusClass = 'pending';
                    if (leave.status === 'APPROVED') statusClass = 'approved';
                    if (leave.status === 'REJECTED') statusClass = 'rejected';
                    if (leave.status === 'CANCELLED') statusClass = 'cancelled';
                    
                    return `
                        <div class="leave-item">
                            <div class="leave-header">
                                <span class="leave-type">${leave.leaveTypeName || leave.leaveTypeId || 'Leave'}</span>
                                <span class="status-badge ${statusClass}">
                                    ${leave.status || 'PENDING'}
                                </span>
                            </div>
                            <div class="leave-dates">
                                <span class="date-range">${startDate} - ${endDate}</span>
                                <span class="days-count">(${days} days)</span>
                            </div>
                            ${leave.reason ? `
                                <div class="leave-reason" title="${leave.reason}">
                                    ${leave.reason.substring(0, 100)}${leave.reason.length > 100 ? '...' : ''}
                                </div>
                            ` : ''}
                            <div class="leave-footer">
                                <span class="applied-date">Applied: ${appliedOn}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            ${leaves.length > 3 ? `
                <div class="view-all-leaves">
                    <button id="viewAllLeavesBtn" class="btn btn-secondary">
                        View All (${leaves.length}) Leave Requests
                    </button>
                </div>
            ` : ''}
        `;

        // Add event listener for "View All" button
        const viewAllBtn = document.getElementById('viewAllLeavesBtn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => this.viewMyLeaves());
        }
    }

    displayNoLeaves() {
        const leavesContainer = document.getElementById('userLeaves');
        if (!leavesContainer) return;

        leavesContainer.innerHTML = `
            <div class="empty-state">
                <p>No leave requests yet</p>
                <button id="applyFirstLeaveBtn" class="btn">Apply for Your First Leave</button>
            </div>
        `;
        
        document.getElementById('applyFirstLeaveBtn')?.addEventListener('click', () => {
            this.goToApplyLeave();
        });
    }

    async loadLeaveBalance() {
        try {
            const result = await authAPI.getUserLeaveBalance();
            
            if (result.success && result.data && Array.isArray(result.data)) {
                this.displayLeaveBalance(result.data);
            } else {
                // Fallback to mock data if API fails
                this.displayMockLeaveBalance();
            }
        } catch (error) {
            console.error('Error loading leave balance:', error);
            this.displayMockLeaveBalance();
        }
    }

    displayLeaveBalance(balanceData) {
        const balanceContainer = document.getElementById('leaveBalance');
        if (!balanceContainer) return;

        if (!balanceData || balanceData.length === 0) {
            this.displayMockLeaveBalance();
            return;
        }

        balanceContainer.innerHTML = balanceData.map(balance => {
            const percentage = balance.maxDays > 0 ? (balance.usedDays / balance.maxDays) * 100 : 0;
            
            return `
                <div class="balance-card">
                    <h4>${balance.typeName || 'Leave'}</h4>
                    <div class="balance-days">${balance.usedDays} / ${balance.maxDays} days</div>
                    <div class="balance-progress">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                    <div class="balance-remaining">
                        Remaining: <strong>${balance.remainingDays} days</strong>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayMockLeaveBalance() {
        const balanceContainer = document.getElementById('leaveBalance');
        if (!balanceContainer) return;

        balanceContainer.innerHTML = `
            <div class="balance-card">
                <h4>Annual Leave</h4>
                <div class="balance-days">12 / 15 days</div>
                <div class="balance-progress">
                    <div class="progress-bar" style="width: 80%"></div>
                </div>
                <div class="balance-remaining">
                    Remaining: <strong>3 days</strong>
                </div>
            </div>
            <div class="balance-card">
                <h4>Sick Leave</h4>
                <div class="balance-days">5 / 10 days</div>
                <div class="balance-progress">
                    <div class="progress-bar" style="width: 50%"></div>
                </div>
                <div class="balance-remaining">
                    Remaining: <strong>5 days</strong>
                </div>
            </div>
            <div class="balance-card">
                <h4>Casual Leave</h4>
                <div class="balance-days">3 / 7 days</div>
                <div class="balance-progress">
                    <div class="progress-bar" style="width: 43%"></div>
                </div>
                <div class="balance-remaining">
                    Remaining: <strong>4 days</strong>
                </div>
            </div>
        `;
    }

    showAllLeavesModal(allLeaves) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h3>All My Leave Requests (${allLeaves.length})</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="leaves-table-container">
                        <table class="leaves-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Days</th>
                                    <th>Status</th>
                                    <th>Reason</th>
                                    <th>Applied On</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allLeaves.map(leave => {
                                    const startDate = leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A';
                                    const endDate = leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A';
                                    const appliedOn = leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : 'N/A';
                                    const days = leave.startDate && leave.endDate ? 
                                        Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 
                                        0;
                                    
                                    // Determine status badge class
                                    let statusClass = 'pending';
                                    if (leave.status === 'APPROVED') statusClass = 'approved';
                                    if (leave.status === 'REJECTED') statusClass = 'rejected';
                                    if (leave.status === 'CANCELLED') statusClass = 'cancelled';
                                    
                                    return `
                                        <tr>
                                            <td>${leave.leaveTypeName || leave.leaveTypeId || 'Leave'}</td>
                                            <td>${startDate}</td>
                                            <td>${endDate}</td>
                                            <td>${days}</td>
                                            <td>
                                                <span class="status-badge ${statusClass}">
                                                    ${leave.status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td>${leave.reason || 'No reason provided'}</td>
                                            <td>${appliedOn}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn close-modal">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        const closeBtns = modal.querySelectorAll('.close-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        modal.style.display = 'block';
    }

    loadUserData() {
        const user = authAPI.getCurrentUser();
        const role = authAPI.getUserRole();

        if (user) {
            // Display user email in navbar
            if (this.userEmail) {
                this.userEmail.textContent = user.email;
            }

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