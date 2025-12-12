// Manage Leave functionality
class ManageLeave {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication and admin role
        if (!authAPI.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        if (!authAPI.isAdmin()) {
            window.location.href = 'dashboard.html';
            return;
        }

        this.bindEvents();
        this.loadLeaveRequests();
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.backToDashboard = document.getElementById('backToDashboard');
        this.createLeaveTypeBtn = document.getElementById('createLeaveTypeBtn');
        this.statusFilter = document.getElementById('statusFilter');
        this.searchLeaves = document.getElementById('searchLeaves');
        
        // Modal elements
        this.modal = document.getElementById('createLeaveTypeModal');
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        this.createLeaveTypeForm = document.getElementById('createLeaveTypeForm');

        this.logoutBtn.addEventListener('click', () => authAPI.logout());
        this.backToDashboard.addEventListener('click', () => window.location.href = 'admin-dashboard.html');
        this.createLeaveTypeBtn.addEventListener('click', () => this.showCreateLeaveTypeModal());
        this.statusFilter.addEventListener('change', () => this.filterLeaves());
        this.searchLeaves.addEventListener('input', () => this.filterLeaves());

        // Modal events
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        if (this.createLeaveTypeForm) {
            this.createLeaveTypeForm.addEventListener('submit', (e) => this.handleCreateLeaveType(e));
        }
    }

    async loadLeaveRequests() {
        const loadingEl = document.getElementById('loadingLeaves');
        const noLeavesEl = document.getElementById('noLeaves');
        const tableBody = document.getElementById('leaveRequestsTableBody');

        if (loadingEl) loadingEl.style.display = 'block';
        if (noLeavesEl) noLeavesEl.style.display = 'none';
        if (tableBody) tableBody.innerHTML = '';

        try {
            const result = await authAPI.getLeaveRequests();
            
            if (loadingEl) loadingEl.style.display = 'none';
            
            if (result.success && result.data && Array.isArray(result.data)) {
                this.displayLeaveRequests(result.data);
            } else {
                if (noLeavesEl) noLeavesEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading leave requests:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (noLeavesEl) noLeavesEl.style.display = 'block';
        }
    }

    displayLeaveRequests(leaveRequests) {
        const tableBody = document.getElementById('leaveRequestsTableBody');
        if (!tableBody) return;

        if (leaveRequests.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        No leave requests found
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = leaveRequests.map(leave => {
            const startDate = new Date(leave.startDate).toLocaleDateString();
            const endDate = new Date(leave.endDate).toLocaleDateString();
            const appliedOn = new Date(leave.createdAt).toLocaleDateString();
            
            // Calculate days
            const days = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1;
            
            return `
                <tr data-status="${leave.status}">
                    <td>${leave.employeeName || 'Unknown Employee'}</td>
                    <td>${leave.leaveTypeName || leave.leaveTypeId}</td>
                    <td>${startDate} to ${endDate}</td>
                    <td>${days} days</td>
                    <td title="${leave.reason || 'No reason provided'}">
                        ${(leave.reason || '').substring(0, 50)}${leave.reason && leave.reason.length > 50 ? '...' : ''}
                    </td>
                    <td>
                        <span class="status-badge ${leave.status.toLowerCase()}">
                            ${leave.status}
                        </span>
                    </td>
                    <td>${appliedOn}</td>
                    <td>
                        ${leave.status === 'PENDING' ? `
                            <button class="btn-action action-btn" data-id="${leave.leaveRequestId || leave.id}" data-action="APPROVED">
                                Approve
                            </button>
                            <button class="btn-action action-btn" data-id="${leave.leaveRequestId || leave.id}" data-action="REJECTED">
                                Reject
                            </button>
                            <button class="btn-action action-btn" data-id="${leave.leaveRequestId || leave.id}" data-action="CANCELLED">
                                Cancel
                            </button>
                            <button class="btn-action action-btn" data-id="${leave.leaveRequestId || leave.id}" data-action="PENDING">
                                Set Pending
                            </button>
                        ` : `
                            <span class="action-disabled">Action Taken</span>
                        `}
                    </td>
                </tr>
            `;
        }).join('');

        // Add event listeners to action buttons
        this.addActionListeners();
    }

    addActionListeners() {
        // Action buttons (Update / Reject / Cancel / Set Pending)
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const leaveRequestId = e.target.getAttribute('data-id');
                const action = e.target.getAttribute('data-action');
                this.updateLeaveStatus(leaveRequestId, action);
            });
        });
    }

    async approveLeave(leaveRequestId, status) {
        const action = status === 'APPROVED' ? 'approve' : 'reject';
        if (!confirm(`Are you sure you want to ${action} this leave request?`)) {
            return;
        }

        try {
            const result = await authAPI.approveLeave(leaveRequestId, status);
            
            if (result.success) {
                alert(`Leave request ${status.toLowerCase()} successfully!`);
                this.loadLeaveRequests(); // Refresh the list
            } else {
                alert(`Failed to ${action} leave: ${result.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(`Error ${action}ing leave:`, error);
            alert(`Error ${action}ing leave request`);
        }
    }

    async updateLeaveStatus(leaveRequestId, actionStatus) {
        // Accept direct API status values like 'APPROVED','REJECTED','CANCELLED','PENDING'
        const statusMap = {
            // Backwards compatibility: map older UI value to API value
            'updateLeave': 'APPROVED',
            'APPROVED': 'APPROVED',
            'REJECTED': 'REJECTED',
            'CANCELLED': 'CANCELLED',
            'PENDING': 'PENDING'
        };

        const status = statusMap[actionStatus] || actionStatus;
        const actionVerb = status === 'APPROVED' ? 'approve' : (status === 'REJECTED' ? 'reject' : (status === 'CANCELLED' ? 'cancel' : (status === 'PENDING' ? 'set pending' : 'update')));

        if (!confirm(`Are you sure you want to ${actionVerb} this leave request?`)) return;

        // Disable action buttons for this leave while request is in progress
        const actionButtons = Array.from(document.querySelectorAll(`.action-btn[data-id="${leaveRequestId}"]`));
        actionButtons.forEach(b => b.disabled = true);

        try {
            const result = await authAPI.updateLeaveStatus(leaveRequestId, status);
            if (result && result.success) {
                alert(`Leave request ${status.toLowerCase()} successfully!`);
                this.loadLeaveRequests();
            } else {
                alert(`Failed to ${actionVerb} leave: ${result?.data?.message || result?.message || 'Unknown error'}`);
                // re-enable buttons on failure
                actionButtons.forEach(b => b.disabled = false);
            }
        } catch (err) {
            console.error('Error updating leave status:', err);
            alert('Error updating leave status');
            actionButtons.forEach(b => b.disabled = false);
        }
    }

    filterLeaves() {
        const statusFilter = this.statusFilter.value;
        const searchTerm = this.searchLeaves.value.toLowerCase();
        
        const rows = document.querySelectorAll('#leaveRequestsTableBody tr');
        rows.forEach(row => {
            const status = row.getAttribute('data-status');
            const text = row.textContent.toLowerCase();
            
            const statusMatch = statusFilter === 'all' || status === statusFilter;
            const searchMatch = text.includes(searchTerm);
            
            row.style.display = statusMatch && searchMatch ? '' : 'none';
        });
    }

    showCreateLeaveTypeModal() {
        if (this.modal) {
            this.modal.style.display = 'block';
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            if (this.createLeaveTypeForm) {
                this.createLeaveTypeForm.reset();
            }
        }
    }

    async handleCreateLeaveType(e) {
        e.preventDefault();
        
        const companyId = authAPI.getCompanyId();
        if (!companyId) {
            alert('No company ID found. Please log in again.');
            return;
        }

        const leaveTypeData = {
            companyId: companyId,
            code: document.getElementById('leaveCode').value.trim(),
            name: document.getElementById('leaveName').value.trim(),
            maxDaysPerYear: parseInt(document.getElementById('maxDays').value)
        };

        if (!leaveTypeData.code || !leaveTypeData.name || !leaveTypeData.maxDaysPerYear) {
            alert('Please fill in all fields.');
            return;
        }

        try {
            const result = await authAPI.createLeaveType(leaveTypeData);
            
            if (result.success) {
                alert('Leave type created successfully!');
                this.closeModal();
            } else {
                alert(`Failed to create leave type: ${result.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating leave type:', error);
            alert('Error creating leave type. Please try again.');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ManageLeave();
});