// Apply Leave functionality
class ApplyLeave {
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
        this.loadLeaveTypes();
        this.loadLeaveBalance();
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.backToDashboard = document.getElementById('backToDashboard');
        this.applyLeaveForm = document.getElementById('applyLeaveForm');
        this.startDateInput = document.getElementById('startDate');
        this.endDateInput = document.getElementById('endDate');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.messageDiv = document.getElementById('message');
        this.loadingDiv = document.getElementById('loading');

        this.logoutBtn.addEventListener('click', () => authAPI.logout());
        this.backToDashboard.addEventListener('click', () => window.location.href = 'dashboard.html');
        this.cancelBtn.addEventListener('click', () => window.location.href = 'dashboard.html');
        
        // Calculate days when dates change
        this.startDateInput.addEventListener('change', () => this.calculateDays());
        this.endDateInput.addEventListener('change', () => this.calculateDays());
        
        // Form submission
        if (this.applyLeaveForm) {
            this.applyLeaveForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        this.startDateInput.min = today;
        this.endDateInput.min = today;
    }

    showMessage(text, type) {
        this.messageDiv.textContent = text;
        this.messageDiv.className = `message ${type}`;
        this.messageDiv.style.display = 'block';
        
        setTimeout(() => {
            this.messageDiv.style.display = 'none';
        }, 5000);
    }

    showLoading(show) {
        this.loadingDiv.style.display = show ? 'block' : 'none';
    }

    async loadLeaveTypes() {
        try {
            const result = await authAPI.getLeaveTypes();
            const select = document.getElementById('leaveType');
            
            if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
                select.disabled = false;
                select.innerHTML = '<option value="">Select Leave Type</option>' +
                    result.data.map(type => `
                        <option value="${type.leaveTypeId || type.id}" 
                                data-max-days="${type.maxDaysPerYear || 30}">
                            ${type.code ? `${type.code} - ` : ''}${type.name} (Max: ${type.maxDaysPerYear || 30} days/year)
                        </option>
                    `).join('');
            } else {
                // No leave types returned by API — do not use hard-coded data
                select.innerHTML = '<option value="">No leave types available</option>';
                select.disabled = true;
            }
        } catch (error) {
            console.error('Error loading leave types:', error);
        }
    }

    calculateDays() {
        const startDate = new Date(this.startDateInput.value);
        const endDate = new Date(this.endDateInput.value);
        
        if (startDate && endDate && startDate <= endDate) {
            // Calculate business days (excluding weekends)
            let count = 0;
            let current = new Date(startDate);
            
            while (current <= endDate) {
                const day = current.getDay();
                if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
                    count++;
                }
                current.setDate(current.getDate() + 1);
            }
            
            document.getElementById('totalDays').textContent = count;
        } else {
            document.getElementById('totalDays').textContent = 0;
        }
    }

    async loadLeaveBalance() {
        // Fetch leave balances from API (falls back to client calculation)
        const balanceContainer = document.getElementById('leaveBalance');
        const userLeavesContainerId = 'userLeaves';
        let userLeavesContainer = document.getElementById(userLeavesContainerId);
        if (!userLeavesContainer) {
            userLeavesContainer = document.createElement('div');
            userLeavesContainer.id = userLeavesContainerId;
            userLeavesContainer.className = 'user-leaves-container';
            if (balanceContainer && balanceContainer.parentNode) {
                balanceContainer.parentNode.insertBefore(userLeavesContainer, balanceContainer.nextSibling);
            }
        }
        if (!balanceContainer) return;

        try {
            const companyId = authAPI.getCompanyId();
            const employeeId = await authAPI.getCurrentUserEmployeeId();

            const result = await authAPI.getLeaveBalance(companyId, employeeId);

            if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
                balanceContainer.innerHTML = result.data.map(item => {
                    const used = item.usedDays ?? (item.maxDays - (item.remainingDays ?? 0));
                    const max = item.maxDays ?? item.maxDaysPerYear ?? 0;
                    const remaining = item.remainingDays ?? Math.max(0, max - used);
                    const pct = max > 0 ? Math.round((remaining / max) * 100) : 0;
                    const title = item.name || item.typeName || item.leaveTypeName || item.leaveTypeId || '';

                    return `
                        <div class="balance-card">
                            <h4>${title}</h4>
                            <div class="balance-days">${remaining} / ${max} days</div>
                            <div class="balance-progress">
                                <div class="progress-bar" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                // Fallback to previous client-side mock/built calculation
                const fallback = await authAPI.getUserLeaveBalance();
                const data = (fallback && fallback.success) ? fallback.data : [];
                if (Array.isArray(data) && data.length > 0) {
                    balanceContainer.innerHTML = data.map(item => {
                        const used = item.usedDays ?? 0;
                        const max = item.maxDays ?? 0;
                        const remaining = item.remainingDays ?? Math.max(0, max - used);
                        const pct = max > 0 ? Math.round((remaining / max) * 100) : 0;
                        const title = item.typeName || item.leaveTypeName || item.leaveTypeId || '';
                        return `
                            <div class="balance-card">
                                <h4>${title}</h4>
                                <div class="balance-days">${remaining} / ${max} days</div>
                                <div class="balance-progress">
                                    <div class="progress-bar" style="width: ${pct}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    balanceContainer.innerHTML = '<div>No leave balance available</div>';
                }
            }
            // Also fetch detailed per-user summary (leaves + per-type usage)
            try {
                const summaryRes = await authAPI.getUserLeaveSummary(companyId, employeeId);
                if (summaryRes && summaryRes.success && summaryRes.data) {
                    const { leaves, perType, aggregates } = summaryRes.data;
                    // Render per-type summary (more detailed)
                    const perTypeHtml = (perType || []).map(t => {
                        const max = t.totalDays || 0;
                        const used = t.usedDays || 0;
                        const remaining = t.remainingDays || Math.max(0, max - used);
                        return `
                            <div class="balance-card detail">
                                <h4>${t.typeName}</h4>
                                <div class="balance-days">Used: ${used} / ${max} days — Remaining: ${remaining}</div>
                            </div>
                        `;
                    }).join('');

                    // Render individual leaves
                    const leavesHtml = (leaves || []).map(l => {
                        const start = l.startDate ? new Date(l.startDate).toLocaleDateString() : '';
                        const end = l.endDate ? new Date(l.endDate).toLocaleDateString() : '';
                        const days = l.startDate && l.endDate ? (Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / (1000*60*60*24)) + 1) : '';
                        const typeName = l.leaveTypeName || l.leaveTypeId || '';
                        return `
                            <div class="leave-row">
                                <div class="leave-type">${typeName}</div>
                                <div class="leave-dates">${start} — ${end} (${days} days)</div>
                                <div class="leave-status">Status: ${l.status}</div>
                                <div class="leave-reason">${(l.reason || '').substring(0, 120)}</div>
                            </div>
                        `;
                    }).join('');

                    userLeavesContainer.innerHTML = `
                        <h3>Your Leave Summary</h3>
                        <div class="per-type-summary">${perTypeHtml || '<div>No per-type data</div>'}</div>
                        <h4>Your Leave Requests</h4>
                        <div class="leaves-list">${leavesHtml || '<div>No leave requests found</div>'}</div>
                    `;
                } else {
                    userLeavesContainer.innerHTML = '<div>No leave summary available</div>';
                }
            } catch (err) {
                console.error('Error loading user leave summary:', err);
                userLeavesContainer.innerHTML = '<div>Error loading leave summary</div>';
            }
        } catch (err) {
            console.error('Error loading leave balance:', err);
            balanceContainer.innerHTML = '<div>No leave balance available</div>';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const companyId = authAPI.getCompanyId();
        const leaveTypeId = document.getElementById('leaveType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const reason = document.getElementById('reason').value;
        const totalDays = parseInt(document.getElementById('totalDays').textContent);

        if (!companyId) {
            this.showMessage('Unable to identify your company. Please log in again.', 'error');
            return;
        }

        if (!leaveTypeId) {
            this.showMessage('Please select a leave type.', 'error');
            return;
        }

        if (totalDays <= 0) {
            this.showMessage('Please select valid dates for your leave.', 'error');
            return;
        }

        const leaveData = {
            companyId: companyId,
            leaveTypeId: leaveTypeId,
            startDate: startDate,
            endDate: endDate,
            reason: reason
        };

        // Ensure employeeId is included from login/session
        try {
            const employeeId = await authAPI.getCurrentUserEmployeeId();
            if (employeeId) {
                leaveData.employeeId = employeeId;
            }
        } catch (err) {
            console.warn('Could not determine employeeId from session:', err);
        }

        try {
            this.showLoading(true);
            const result = await authAPI.applyLeave(leaveData);
            this.showLoading(false);

            if (result.success) {
                this.showMessage('Leave application submitted successfully!', 'success');
                this.applyLeaveForm.reset();
                document.getElementById('totalDays').textContent = '0';
                // Stay on the same page after success (no redirect)
                // Optionally, you can enable a manual navigation or refresh the balances
                // For now, refresh leave balances to reflect the new application
                this.loadLeaveBalance();
            } else {
                this.showMessage(`Failed to submit leave: ${result.data?.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            this.showLoading(false);
            this.showMessage('Error submitting leave application. Please try again.', 'error');
            console.error('Submit leave error:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ApplyLeave();
});