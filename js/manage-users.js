// Manage Users functionality
class ManageUsers {
    constructor() {
        this.allowedFields = [
            'employeeNumber',
            'firstName',
            'middleName',
            'lastName',
            'preferredName',
            'email',
            'phoneMobile',
            'dateOfBirth',
            'gender',
            'nationality',
            'nationalIdNumber',
            'employmentType',
            'hireDate',
            'terminationDate',
            'employmentStatus',
            'workLocationId',
            'currentPositionId',
            'managerEmployeeId',
            'customFields',
            'addressId',
            'photoUrl',
            'emergencyContactId',
            'bankAccountInfo'
        ];
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
        this.loadEmployees();
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.backToDashboard = document.getElementById('backToDashboard');
        this.addNewEmployeeBtn = document.getElementById('addNewEmployeeBtn');
        this.searchEmployees = document.getElementById('searchEmployees');
        this.searchBtn = document.getElementById('searchBtn');

        this.logoutBtn.addEventListener('click', () => authAPI.logout());
        this.backToDashboard.addEventListener('click', () => window.location.href = 'admin-dashboard.html');
        this.addNewEmployeeBtn.addEventListener('click', () => window.location.href = 'admin-dashboard.html');
        
        // Search functionality
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.searchEmployeesList());
        }
        
        if (this.searchEmployees) {
            this.searchEmployees.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchEmployeesList();
            });
        }
    }

    async loadEmployees() {
        const loadingEl = document.getElementById('loadingEmployees');
        const noEmployeesEl = document.getElementById('noEmployees');
        const tableBody = document.getElementById('employeesTableBody');

        if (loadingEl) loadingEl.style.display = 'block';
        if (noEmployeesEl) noEmployeesEl.style.display = 'none';
        if (tableBody) tableBody.innerHTML = '';

        try {
            const companyId = authAPI.getCompanyId();
            if (!companyId) {
                throw new Error('No company ID found');
            }

            console.log('Loading employees for company:', companyId);
            const result = await authAPI.getEmployees(companyId);
            
            if (loadingEl) loadingEl.style.display = 'none';
            
            if (result.success && result.data && Array.isArray(result.data)) {
                this.displayEmployees(result.data);
            } else {
                if (noEmployeesEl) {
                    noEmployeesEl.style.display = 'block';
                    noEmployeesEl.innerHTML = `<p>${result.data?.message || 'No employees found'}</p>`;
                }
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (noEmployeesEl) {
                noEmployeesEl.style.display = 'block';
                noEmployeesEl.innerHTML = `<p>Error loading employees: ${error.message}</p>`;
            }
        }
    }


    displayEmployees(employees) {
        const tableBody = document.getElementById('employeesTableBody');
        if (!tableBody) return;

        if (employees.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        No employees found. Add your first employee!
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = employees.map(employee => `
            <tr>
                <td>
                    ${employee.firstName || ''} ${employee.lastName || ''}
                    ${employee.userId ? '' : '<span class="pending-badge">Pending</span>'}
                </td>
                <td>${employee.email || 'N/A'}</td>
                <td>${employee.phoneMobile || 'N/A'}</td>
                <td>${employee.gender || 'N/A'}</td>
                <td>${employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <span class="status-badge ${employee.isActive !== false ? 'active' : 'inactive'}">
                        ${employee.userId ? 'Registered' : 'Invited'}
                    </span>
                </td>
                <td>
                    <button class="btn-action edit-btn" data-id="${employee.employeeId || employee.id}">
                        <span class="action-icon">✏️</span> Edit
                    </button>
                    <button class="btn-action delete-btn" data-id="${employee.employeeId || employee.id}">
                        <span class="action-icon">🗑️</span> Delete
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners to action buttons
        this.addActionListeners();
    }

    addActionListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = e.target.getAttribute('data-id');
                this.editEmployee(employeeId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = e.target.getAttribute('data-id');
                this.deleteEmployee(employeeId);
            });
        });
    }

    async editEmployee(employeeId) {
        try {
            const result = await authAPI.getEmployeeById(employeeId);
            
            if (result.success) {
                // Show edit modal with employee data
                this.showEditModal(result.data);
            } else {
                alert('Failed to fetch employee details');
            }
        } catch (error) {
            console.error('Error fetching employee:', error);
            alert('Error fetching employee details');
        }
    }

    showEditModal(employee) {
        // Create or show edit modal
        let modal = document.getElementById('editEmployeeModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editEmployeeModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Edit Employee Details</h3>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="editEmployeeForm">
                            <div class="form-grid">
                                <!-- Basic Information -->
                                <div class="form-section">
                                    <h4>Basic Information</h4>
                                    <div class="form-group">
                                        <label for="editEmployeeNumber">Employee Number</label>
                                        <input type="text" id="editEmployeeNumber">
                                    </div>
                                    <div class="form-group">
                                        <label for="editFirstName">First Name *</label>
                                        <input type="text" id="editFirstName" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="editMiddleName">Middle Name</label>
                                        <input type="text" id="editMiddleName">
                                    </div>
                                    <div class="form-group">
                                        <label for="editLastName">Last Name *</label>
                                        <input type="text" id="editLastName" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="editPreferredName">Preferred Name</label>
                                        <input type="text" id="editPreferredName">
                                    </div>
                                    <div class="form-group">
                                        <label for="editEmail">Email *</label>
                                        <input type="email" id="editEmail" required>
                                    </div>
                                </div>
                                
                                <!-- Personal Details -->
                                <div class="form-section">
                                    <h4>Personal Details</h4>
                                    <div class="form-group">
                                        <label for="editPhoneMobile">Mobile Phone</label>
                                        <input type="tel" id="editPhoneMobile">
                                    </div>
                                    <div class="form-group">
                                        <label for="editDateOfBirth">Date of Birth</label>
                                        <input type="date" id="editDateOfBirth">
                                    </div>
                                    <div class="form-group">
                                        <label for="editGender">Gender</label>
                                        <select id="editGender">
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="editNationality">Nationality</label>
                                        <input type="text" id="editNationality">
                                    </div>
                                    <div class="form-group">
                                        <label for="editNationalIdNumber">National ID</label>
                                        <input type="text" id="editNationalIdNumber">
                                    </div>
                                </div>
                                
                                <!-- Employment Details -->
                                <div class="form-section">
                                    <h4>Employment Details</h4>
                                    <div class="form-group">
                                        <label for="editEmploymentType">Employment Type</label>
                                        <select id="editEmploymentType">
                                            <option value="">Select Type</option>
                                            <option value="FULL_TIME">Full Time</option>
                                            <option value="PART_TIME">Part Time</option>
                                            <option value="CONTRACT">Contract</option>
                                            <option value="INTERN">Intern</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="editHireDate">Hire Date *</label>
                                        <input type="date" id="editHireDate" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="editTerminationDate">Termination Date</label>
                                        <input type="date" id="editTerminationDate">
                                    </div>
                                    <div class="form-group">
                                        <label for="editEmploymentStatus">Employment Status *</label>
                                        <select id="editEmploymentStatus" required>
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                            <option value="ON_LEAVE">On Leave</option>
                                            <option value="TERMINATED">Terminated</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn">Save Changes</button>
                                <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add close event
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            // Add form submit event
            modal.querySelector('#editEmployeeForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleEditSubmit(employee.employeeId || employee.id);
            });
        }
        
        // Populate form with employee data
        this.allowedFields.forEach(field => {
            const input = document.getElementById(`edit${this.capitalizeFirstLetter(field)}`);
            if (input) {
                input.value = employee[field] || '';
            }
        });
        
        modal.style.display = 'block';
    }
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    async handleEditSubmit(employeeId) {
        const formData = {};
        
        // Collect only allowed fields
        this.allowedFields.forEach(field => {
            const input = document.getElementById(`edit${this.capitalizeFirstLetter(field)}`);
            if (input && input.value !== '') {
                formData[field] = input.value;
            }
        });
        
        try {
            const result = await authAPI.updateEmployeeDetails(employeeId, formData);
            
            if (result.success) {
                alert('Employee updated successfully!');
                document.getElementById('editEmployeeModal').style.display = 'none';
                this.loadEmployees(); // Refresh the list
            } else {
                alert(`Failed to update employee: ${result.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating employee:', error);
            alert('Error updating employee');
        }
    }


    async deleteEmployee(employeeId) {
        if (!confirm('Are you sure you want to delete this employee?')) {
            return;
        }
        
        try {
            const result = await authAPI.deleteEmployee(employeeId);
            
            if (result.success) {
                alert('Employee deleted successfully!');
                this.loadEmployees(); // Refresh the list
            } else {
                alert(`Failed to delete employee: ${result.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Error deleting employee');
        }
    }

    searchEmployeesList() {
        const searchTerm = this.searchEmployees ? this.searchEmployees.value.toLowerCase() : '';
        
        const rows = document.querySelectorAll('#employeesTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ManageUsers();
});