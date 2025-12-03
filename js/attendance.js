// Attendance functionality
class Attendance {
    constructor() {
        this.employeeId = null;
        this.companyId = null;
        this.currentStatus = null;
        this.user = null;
        this.todayEvents = [];
        this.init();
    }

    async init() {
        // Check authentication
        if (!authAPI.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        await this.bindEvents();
        await this.loadUserData();
        await this.loadEmployeeId();
        await this.loadTodayStatus();
        await this.loadAttendanceHistory();
        
        // Auto-refresh status every 30 seconds
        this.startAutoRefresh();
    }

    startAutoRefresh() {
        setInterval(() => {
            if (this.employeeId && this.companyId) {
                console.log('Auto-refreshing attendance status...');
                this.loadTodayStatus();
            }
        }, 30000); // 30 seconds
    }

    async bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.backToDashboard = document.getElementById('backToDashboard');
        this.clockInBtn = document.getElementById('clockInBtn');
        this.clockOutBtn = document.getElementById('clockOutBtn');
        this.filterBtn = document.getElementById('filterBtn');
        this.startDateInput = document.getElementById('startDate');
        this.endDateInput = document.getElementById('endDate');
        this.refreshStatusBtn = document.getElementById('refreshStatusBtn');

        this.logoutBtn.addEventListener('click', () => authAPI.logout());
        this.backToDashboard.addEventListener('click', () => this.goToDashboard());
        this.clockInBtn.addEventListener('click', () => this.handleClockIn());
        this.clockOutBtn.addEventListener('click', () => this.handleClockOut());
        this.filterBtn.addEventListener('click', () => this.loadAttendanceHistory());
        
        if (this.refreshStatusBtn) {
            this.refreshStatusBtn.addEventListener('click', () => {
                this.loadTodayStatus();
                this.showMessage('Status refreshed', 'success');
            });
        }

        // Set default dates (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        this.startDateInput.value = startDate.toISOString().split('T')[0];
        this.endDateInput.value = endDate.toISOString().split('T')[0];
    }

    async loadUserData() {
        this.user = authAPI.getCurrentUser();
        if (this.user) {
            this.companyId = authAPI.getCompanyId();
            
            const welcomeMessage = document.getElementById('welcomeMessage');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${this.user.username || this.user.email}!`;
            }
            
            console.log('User loaded:', this.user);
            console.log('Company ID:', this.companyId);
        } else {
            console.error('No user data found');
        }
    }

    async loadEmployeeId() {
        if (!this.user || !this.companyId) {
            console.error('Cannot load employee ID: Missing user or company data');
            return;
        }

        console.log('Attempting to load employee ID...');
        
        // Method 1: Try to get employee ID from API
        this.employeeId = await authAPI.getCurrentUserEmployeeId();
        
        // Method 2: If API fails, check localStorage
        if (!this.employeeId) {
            console.log('Employee ID not found via API, checking localStorage...');
            this.employeeId = localStorage.getItem('currentEmployeeId');
        }
        
        // Method 3: If still not found, try to find by email in employees list
        if (!this.employeeId && this.user.email) {
            console.log('Searching for employee by email:', this.user.email);
            try {
                const result = await authAPI.getEmployees(this.companyId);
                if (result.success && result.data && Array.isArray(result.data)) {
                    const employees = result.data;
                    const employee = employees.find(emp => 
                        emp.email && emp.email.toLowerCase() === this.user.email.toLowerCase()
                    );
                    
                    if (employee) {
                        this.employeeId = employee.employeeId || employee.id;
                        localStorage.setItem('currentEmployeeId', this.employeeId);
                        console.log('Found employee by email:', employee);
                    }
                }
            } catch (error) {
                console.error('Error searching employees:', error);
            }
        }
        
        // Method 4: If still not found, use userId as fallback (some systems use same ID)
        if (!this.employeeId && this.user.userId) {
            console.log('Using userId as fallback employee ID:', this.user.userId);
            this.employeeId = this.user.userId;
            localStorage.setItem('currentEmployeeId', this.employeeId);
        }
        
        console.log('Final employee ID:', this.employeeId);
        
        if (!this.employeeId) {
            this.showStatusError('Cannot load attendance: Employee profile not found. Please contact admin.');
            this.disableAllActions();
            this.showMessage('Employee profile not found. Please contact administrator.', 'error');
        } else {
            localStorage.setItem('currentEmployeeId', this.employeeId);
            console.log('Employee ID loaded successfully:', this.employeeId);
        }
    }

    async loadTodayStatus() {
        if (!this.employeeId || !this.companyId) {
            console.error('Missing employee or company ID');
            this.showStatusError('Cannot load attendance: Missing profile information');
            return;
        }

        console.log('Loading today\'s status for:', { 
            employeeId: this.employeeId, 
            companyId: this.companyId 
        });
        
        try {
            const status = await authAPI.getTodayAttendanceFromEvents(
                this.companyId, 
                this.employeeId
            );
            
            this.currentStatus = status;
            this.todayEvents = status.events || [];
            
            console.log('Today\'s status loaded:', status);
            console.log('Today events:', this.todayEvents);
            
            this.updateStatusDisplay(status);
            this.updateActionButtons(status);
            
            // Show event count
            if (this.todayEvents.length > 0) {
                console.log(`Found ${this.todayEvents.length} events for today`);
            }
            
        } catch (error) {
            console.error('Error loading today\'s status:', error);
            this.showStatusError('Error loading attendance status. Please try refreshing.');
            this.disableAllActions();
        }
    }

    updateStatusDisplay(status) {
        const statusDisplay = document.getElementById('currentStatus');
        if (!statusDisplay) return;

        const clockInTime = status.clockInTime ? new Date(status.clockInTime) : null;
        const clockOutTime = status.clockOutTime ? new Date(status.clockOutTime) : null;
        
        if (!clockInTime && !clockOutTime) {
            statusDisplay.innerHTML = `
                <div class="status-icon pending">⏰</div>
                <div class="status-details">
                    <h4>Ready to Clock In</h4>
                    <p>You haven't clocked in yet today.</p>
                    <p class="status-time">Click "Clock In" to start your day</p>
                    <button id="refreshStatusBtn" class="refresh-btn">↻ Refresh Status</button>
                </div>
            `;
            
            // Re-bind refresh button
            const refreshBtn = document.getElementById('refreshStatusBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadTodayStatus();
                    this.showMessage('Status refreshed', 'success');
                });
            }
            return;
        }

        let statusText = 'Clocked In';
        let statusClass = 'in-progress';
        let icon = '✅';
        let hoursWorked = null;
        let statusMessage = 'You are currently clocked in';
        
        if (clockInTime && clockOutTime) {
            statusText = 'Clocked Out';
            statusClass = 'completed';
            icon = '🏁';
            statusMessage = 'You have completed your work for today';
            
            // Calculate hours worked
            hoursWorked = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2);
        }

        // Count events
        const eventCount = status.events ? status.events.length : 0;
        const clockInCount = status.allClockIns ? status.allClockIns.length : 0;
        const clockOutCount = status.allClockOuts ? status.allClockOuts.length : 0;

        statusDisplay.innerHTML = `
            <div class="status-icon ${statusClass}">${icon}</div>
            <div class="status-details">
                <h4>${statusText}</h4>
                <p>${statusMessage}</p>
                ${clockInTime ? `<div class="event-detail-item">
                    <span class="event-label">Clock In:</span>
                    <span class="event-value">${clockInTime.toLocaleTimeString()}</span>
                </div>` : ''}
                ${clockOutTime ? `<div class="event-detail-item">
                    <span class="event-label">Clock Out:</span>
                    <span class="event-value">${clockOutTime.toLocaleTimeString()}</span>
                </div>` : ''}
                ${hoursWorked ? `<div class="event-detail-item">
                    <span class="event-label">Hours Worked:</span>
                    <span class="event-value">${hoursWorked} hours</span>
                </div>` : ''}
                ${eventCount > 0 ? `<div class="event-detail-item">
                    <span class="event-label">Today's Events:</span>
                    <span class="event-value">${eventCount} (${clockInCount} in, ${clockOutCount} out)</span>
                </div>` : ''}
                <p class="status-time">Last Updated: ${new Date().toLocaleTimeString()}</p>
                <button id="refreshStatusBtn" class="refresh-btn">↻ Refresh Status</button>
            </div>
        `;
        
        // Re-bind refresh button
        const refreshBtn = document.getElementById('refreshStatusBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadTodayStatus();
                this.showMessage('Status refreshed', 'success');
            });
        }
    }

    updateActionButtons(status) {
        const clockInBtn = document.getElementById('clockInBtn');
        const clockOutBtn = document.getElementById('clockOutBtn');
        
        if (!clockInBtn || !clockOutBtn) return;

        const clockInTime = status.clockInTime;
        const clockOutTime = status.clockOutTime;

        // Enable/disable buttons based on status
        if (!clockInTime) {
            // Not clocked in yet
            clockInBtn.disabled = false;
            clockOutBtn.disabled = true;
            clockInBtn.innerHTML = '<span class="action-icon">🕐</span> Clock In';
            clockOutBtn.innerHTML = '<span class="action-icon">🕔</span> Clock Out';
        } else if (clockInTime && !clockOutTime) {
            // Clocked in but not out
            clockInBtn.disabled = true;
            clockOutBtn.disabled = false;
            clockInBtn.innerHTML = '<span class="action-icon">✅</span> Clocked In';
            clockOutBtn.innerHTML = '<span class="action-icon">🕔</span> Clock Out';
        } else {
            // Already clocked out
            clockInBtn.disabled = true;
            clockOutBtn.disabled = true;
            clockInBtn.innerHTML = '<span class="action-icon">✅</span> Clocked In';
            clockOutBtn.innerHTML = '<span class="action-icon">🏁</span> Clocked Out';
        }
    }

    async handleClockIn() {
        if (!this.companyId || !this.employeeId) {
            this.showMessage('Cannot clock in: Missing company or employee information', 'error');
            return;
        }
        
        try {
            this.clockInBtn.disabled = true;
            this.clockInBtn.innerHTML = '<span class="action-icon">⏳</span> Clocking In...';
            
            const result = await authAPI.clockIn(this.companyId, this.employeeId);
            
            if (result.success) {
                this.showMessage('Successfully clocked in!', 'success');
                
                // Update status after a short delay
                setTimeout(() => {
                    this.loadTodayStatus();
                    this.loadAttendanceHistory(); // Also refresh history
                }, 1500);
                
            } else {
                this.showMessage(`Failed to clock in: ${result.data?.message || 'Unknown error'}`, 'error');
                this.clockInBtn.disabled = false;
                this.clockInBtn.innerHTML = '<span class="action-icon">🕐</span> Clock In';
            }
        } catch (error) {
            console.error('Error clocking in:', error);
            this.showMessage('Error clocking in. Please try again.', 'error');
            this.clockInBtn.disabled = false;
            this.clockInBtn.innerHTML = '<span class="action-icon">🕐</span> Clock In';
        }
    }

    async handleClockOut() {
        if (!this.companyId || !this.employeeId) {
            this.showMessage('Cannot clock out: Missing company or employee information', 'error');
            return;
        }
        
        try {
            this.clockOutBtn.disabled = true;
            this.clockOutBtn.innerHTML = '<span class="action-icon">⏳</span> Clocking Out...';
            
            const result = await authAPI.clockOut(this.companyId, this.employeeId);
            
            if (result.success) {
                this.showMessage('Successfully clocked out!', 'success');
                
                // Update status after a short delay
                setTimeout(() => {
                    this.loadTodayStatus();
                    this.loadAttendanceHistory(); // Also refresh history
                }, 1500);
                
            } else {
                this.showMessage(`Failed to clock out: ${result.data?.message || 'Unknown error'}`, 'error');
                this.clockOutBtn.disabled = false;
                this.clockOutBtn.innerHTML = '<span class="action-icon">🕔</span> Clock Out';
            }
        } catch (error) {
            console.error('Error clocking out:', error);
            this.showMessage('Error clocking out. Please try again.', 'error');
            this.clockOutBtn.disabled = false;
            this.clockOutBtn.innerHTML = '<span class="action-icon">🕔</span> Clock Out';
        }
    }

    async loadAttendanceHistory() {
        if (!this.employeeId || !this.companyId) {
            console.error('Missing employee or company ID for loading history');
            this.showMessage('Cannot load attendance history: No employee profile', 'error');
            return;
        }

        const loadingEl = document.getElementById('loadingAttendance');
        const noAttendanceEl = document.getElementById('noAttendance');
        const tableBody = document.getElementById('attendanceTableBody');

        if (loadingEl) loadingEl.style.display = 'block';
        if (noAttendanceEl) noAttendanceEl.style.display = 'none';
        if (tableBody) tableBody.innerHTML = '';

        try {
            const startDate = this.startDateInput.value;
            const endDate = this.endDateInput.value;
            
            console.log('Loading attendance summary for:', { 
                employeeId: this.employeeId, 
                companyId: this.companyId,
                startDate, 
                endDate 
            });
            
            const dailySummaries = await authAPI.getAttendanceSummary(
                this.companyId, 
                this.employeeId, 
                startDate, 
                endDate
            );
            
            if (loadingEl) loadingEl.style.display = 'none';
            
            console.log('Daily summaries received:', dailySummaries);
            
            if (dailySummaries && dailySummaries.length > 0) {
                this.displayAttendanceHistory(dailySummaries);
            } else {
                if (noAttendanceEl) {
                    noAttendanceEl.style.display = 'block';
                    noAttendanceEl.innerHTML = '<p>No attendance records found for the selected period.</p>';
                }
            }
        } catch (error) {
            console.error('Error loading attendance history:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (noAttendanceEl) {
                noAttendanceEl.style.display = 'block';
                noAttendanceEl.innerHTML = `<p>Error loading attendance records</p>`;
            }
        }
    }

    displayAttendanceHistory(dailySummaries) {
        const tableBody = document.getElementById('attendanceTableBody');
        if (!tableBody) return;

        if (dailySummaries.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        No attendance records found for the selected period.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = dailySummaries.map(summary => {
            const clockInTime = summary.clockInTime ? new Date(summary.clockInTime) : null;
            const clockOutTime = summary.clockOutTime ? new Date(summary.clockOutTime) : null;
            
            let statusClass = 'pending';
            let statusText = 'Pending';
            
            if (summary.status === 'IN_PROGRESS') {
                statusClass = 'in-progress';
                statusText = 'In Progress';
            } else if (summary.status === 'COMPLETED') {
                statusClass = 'completed';
                statusText = 'Completed';
            }

            // Format date nicely
            const date = new Date(summary.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${clockInTime ? clockInTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</td>
                    <td>${clockOutTime ? clockOutTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</td>
                    <td>Office</td>
                    <td><strong>${summary.hoursWorked || '0.00'}</strong> hrs</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    showMessage(text, type) {
        const messageDiv = document.getElementById('attendanceMessage');
        if (messageDiv) {
            messageDiv.textContent = text;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
            
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }

    goToDashboard() {
        const role = authAPI.getUserRole();
        if (role === 'COMPANY_ADMIN') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

// Initialize attendance when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Attendance();
});