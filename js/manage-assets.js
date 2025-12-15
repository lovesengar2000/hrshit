// Manage Assets functionality
class ManageAssets {
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
        this.loadAssets();
        this.loadAssignedAssets();
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.backToDashboard = document.getElementById('backToDashboard');
        this.addAssetBtn = document.getElementById('addAssetBtn');
        this.typeFilter = document.getElementById('typeFilter');
        this.searchAssets = document.getElementById('searchAssets');
        
        // Modal elements
        this.modal = document.getElementById('assetModal');
        this.assignModal = document.getElementById('assignModal');
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        this.assetForm = document.getElementById('assetForm');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalSubmitBtn = document.getElementById('modalSubmitBtn');
        this.assignForm = document.getElementById('assignForm');
        this.assignSubmitBtn = document.getElementById('assignSubmitBtn');
        this.returnSubmitBtn = document.getElementById('returnSubmitBtn');

        this.logoutBtn.addEventListener('click', () => authAPI.logout());
        this.backToDashboard.addEventListener('click', () => window.location.href = 'admin-dashboard.html');
        this.addAssetBtn.addEventListener('click', () => this.showAddAssetModal());
        this.typeFilter.addEventListener('change', () => this.filterAssets());
        this.searchAssets.addEventListener('input', () => this.filterAssets());

        // Modal events
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        if (this.assetForm) {
            this.assetForm.addEventListener('submit', (e) => this.handleAssetSubmit(e));
        }
        if (this.assignForm) {
            this.assignForm.addEventListener('submit', (e) => this.handleAssignSubmit(e));
        }
        if (this.returnSubmitBtn) {
            this.returnSubmitBtn.addEventListener('click', () => this.handleReturnSubmit());
        }
    }

    async loadAssets() {
        const loadingEl = document.getElementById('loadingAssets');
        const noAssetsEl = document.getElementById('noAssets');
        const tableBody = document.getElementById('assetsTableBody');

        if (loadingEl) loadingEl.style.display = 'block';
        if (noAssetsEl) noAssetsEl.style.display = 'none';
        if (tableBody) tableBody.innerHTML = '';

        try {
            const result = await authAPI.getAssets();
            
            if (loadingEl) loadingEl.style.display = 'none';
            
            if (result.success && result.data && Array.isArray(result.data)) {
                this.displayAssets(result.data);
            } else {
                if (noAssetsEl) noAssetsEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading assets:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (noAssetsEl) noAssetsEl.style.display = 'block';
        }
    }

    displayAssets(assets) {
        const tableBody = document.getElementById('assetsTableBody');
        if (!tableBody) return;

        if (assets.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        No assets found. Add your first asset!
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = assets.map(asset => `
            <tr data-type="${asset.type || ''}">
                <td><strong>${asset.assetTag || 'N/A'}</strong></td>
                <td>${asset.type || 'N/A'}</td>
                <td>${asset.model || 'N/A'}</td>
                <td>${asset.serialNumber || 'N/A'}</td>
                <td>
                    <span class="condition-badge ${(asset.condition || '').toLowerCase()}">
                        ${asset.condition || 'Unknown'}
                    </span>
                </td>
                <td>${asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}</td>
                <td>${asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn-action assign-btn" data-id="${asset.assetId || asset.id}">
                        🔗 Assign
                    </button>
                    <button class="btn-action return-btn" data-id="${asset.assetId || asset.id}">
                        ↩️ Return
                    </button>
                    <button class="btn-action edit-btn" data-id="${asset.assetId || asset.id}">
                        ✏️ Edit
                    </button>
                    <button class="btn-action delete-btn" data-id="${asset.assetId || asset.id}">
                        🗑️ Delete
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
                const assetId = e.target.getAttribute('data-id');
                this.editAsset(assetId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assetId = e.target.getAttribute('data-id');
                this.deleteAsset(assetId);
            });
        });

        // Assign buttons
        document.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assetId = e.target.getAttribute('data-id');
                this.showAssignModal(assetId, false);
            });
        });

        // Return buttons
        document.querySelectorAll('.return-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assetId = e.target.getAttribute('data-id');
                this.showAssignModal(assetId, true);
            });
        });
    }

    filterAssets() {
        const typeFilter = this.typeFilter.value;
        const searchTerm = this.searchAssets.value.toLowerCase();
        
        const rows = document.querySelectorAll('#assetsTableBody tr');
        rows.forEach(row => {
            const type = row.getAttribute('data-type');
            const text = row.textContent.toLowerCase();
            
            const typeMatch = typeFilter === 'all' || type === typeFilter;
            const searchMatch = text.includes(searchTerm);
            
            row.style.display = typeMatch && searchMatch ? '' : 'none';
        });
    }

    showAddAssetModal() {
        this.modalTitle.textContent = 'Add New Asset';
        this.modalSubmitBtn.textContent = 'Add Asset';
        this.assetForm.reset();
        document.getElementById('assetId').value = '';
        this.modal.style.display = 'block';
    }

    async editAsset(assetId) {
        try {
            const result = await authAPI.getAssets();
            if (!result.success || !result.data) {
                alert('Failed to fetch asset details');
                return;
            }

            const asset = result.data.find(a => (a.assetId || a.id) === assetId);
            if (!asset) {
                alert('Asset not found');
                return;
            }

            this.modalTitle.textContent = 'Edit Asset';
            this.modalSubmitBtn.textContent = 'Update Asset';
            
            // Populate form
            document.getElementById('assetId').value = asset.assetId || asset.id;
            document.getElementById('assetTag').value = asset.assetTag || '';
            document.getElementById('assetType').value = asset.type || '';
            document.getElementById('model').value = asset.model || '';
            document.getElementById('serialNumber').value = asset.serialNumber || '';
            document.getElementById('condition').value = asset.condition || '';
            document.getElementById('purchaseDate').value = asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '';
            document.getElementById('purchaseCost').value = asset.purchaseCost || '';
            document.getElementById('warrantyExpiry').value = asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '';
            
            this.modal.style.display = 'block';
        } catch (error) {
            console.error('Error fetching asset details:', error);
            alert('Error fetching asset details');
        }
    }

    async loadAssignedAssets() {
        const loadingEl = document.getElementById('loadingAssignedAssets');
        const noAssignedEl = document.getElementById('noAssignedAssets');
        const tableBody = document.getElementById('assignedAssetsTableBody');

        if (loadingEl) loadingEl.style.display = 'block';
        if (noAssignedEl) noAssignedEl.style.display = 'none';
        if (tableBody) tableBody.innerHTML = '';

        try {
            const result = await authAPI.getAssignedAssets();
            
            if (loadingEl) loadingEl.style.display = 'none';
            
            if (result.success && result.data && Array.isArray(result.data)) {
                this.displayAssignedAssets(result.data);
            } else {
                if (noAssignedEl) noAssignedEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading assigned assets:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (noAssignedEl) noAssignedEl.style.display = 'block';
        }
    }

    displayAssignedAssets(assignments) {
        const tableBody = document.getElementById('assignedAssetsTableBody');
        if (!tableBody) return;

        if (assignments.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        No assigned assets pending return.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = assignments.map(assignment => `
            <tr data-assignment-id="${assignment.assignmentId || ''}">
                <td><strong>${assignment.assetTag || 'N/A'}</strong></td>
                <td>${assignment.type || 'N/A'}</td>
                <td>${assignment.serialNumber || 'N/A'}</td>
                <td>${assignment.employeeId || 'N/A'}</td>
                <td>${assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}</td>
                <td>${assignment.notes || '-'}</td>
                <td>
                    <button class="btn-action return-assigned-btn" data-assignment-id="${assignment.assignmentId || ''}">
                        ↩️ Return
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners to return buttons
        this.addAssignedAssetListeners();
    }

    addAssignedAssetListeners() {
        document.querySelectorAll('.return-assigned-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignmentId = e.target.getAttribute('data-assignment-id');
                this.showReturnModal(assignmentId);
            });
        });
    }

    showReturnModal(assignmentId) {
        try {
            document.getElementById('assignAssetId').value = assignmentId || '';
            document.getElementById('employeeId').value = '';
            document.getElementById('returnedAt').value = '';
            document.getElementById('returnedCondition').value = '';
            document.getElementById('assignNotes').value = '';

            document.getElementById('assignModalTitle').textContent = 'Return Asset';

            if (this.assignSubmitBtn) this.assignSubmitBtn.style.display = 'none';
            if (this.returnSubmitBtn) this.returnSubmitBtn.style.display = '';

            if (this.assignModal) this.assignModal.style.display = 'block';
        } catch (error) {
            console.error('Error showing return modal:', error);
        }
    }

    closeModal() {
        if (this.modal) this.modal.style.display = 'none';
        if (this.assetForm) this.assetForm.reset();
        if (this.assignModal) this.assignModal.style.display = 'none';
        if (this.assignForm) this.assignForm.reset();
    }

    showAssignModal(assetId, isReturn = false) {
        try {
            // For assign, store assetId; for return, store as assignmentId
            if (isReturn) {
                document.getElementById('assignAssetId').value = assetId || '';
                document.getElementById('assignAssetId').dataset.isAssignmentId = 'true';
            } else {
                document.getElementById('assignAssetId').value = assetId || '';
                document.getElementById('assignAssetId').dataset.isAssignmentId = 'false';
            }
            document.getElementById('employeeId').value = '';
            document.getElementById('returnedAt').value = '';
            document.getElementById('returnedCondition').value = '';
            document.getElementById('assignNotes').value = '';

            const title = isReturn ? 'Return Asset' : 'Assign Asset';
            document.getElementById('assignModalTitle').textContent = title;

            if (this.assignSubmitBtn) this.assignSubmitBtn.style.display = isReturn ? 'none' : '';
            if (this.returnSubmitBtn) this.returnSubmitBtn.style.display = isReturn ? '' : 'none';

            if (this.assignModal) this.assignModal.style.display = 'block';
        } catch (error) {
            console.error('Error showing assign modal:', error);
        }
    }

    async handleAssignSubmit(e) {
        e.preventDefault();
        const assetId = document.getElementById('assignAssetId').value;
        const employeeId = document.getElementById('employeeId').value.trim();
        // For assign we only send assetId and employeeId (return fields are not sent here)

        if (!assetId || !employeeId) {
            alert('Asset ID and Employee ID are required to assign.');
            return;
        }

        try {
            const payload = {
                assetId,
                employeeId,
            };
            const result = await authAPI.assignAsset(payload);
            const ok = result && (result.success || result.status === 200);
            if (ok) {
                alert('Asset assigned successfully!');
                this.closeModal();
                this.loadAssets();
            } else {
                alert(`Failed to assign asset: ${result?.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error assigning asset:', error);
            alert('Error assigning asset');
        }
    }

    async handleReturnSubmit() {
        const assignmentId = document.getElementById('assignAssetId').value;
        const employeeId = document.getElementById('employeeId').value.trim() || null;
        const returnedAtVal = document.getElementById('returnedAt').value;
        const returnedAt = returnedAtVal ? new Date(returnedAtVal).toISOString() : new Date().toISOString();
        const returnedCondition = document.getElementById('returnedCondition').value || null;
        const notes = document.getElementById('assignNotes').value || null;

        if (!assignmentId) {
            alert('Assignment ID is required to return.');
            return;
        }

        try {
            const payload = {
                assignmentId,
                employeeId,
                returnedAt,
                returnedCondition,
                notes,
            };
            const result = await authAPI.returnAsset(payload);
            const ok = result && (result.success || result.status === 200);
            if (ok) {
                alert('Asset returned successfully!');
                this.closeModal();
                this.loadAssets();
            } else {
                alert(`Failed to return asset: ${result?.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error returning asset:', error);
            alert('Error returning asset');
        }
    }

    async handleAssetSubmit(e) {
        e.preventDefault();
        
        const assetId = document.getElementById('assetId').value;
        const assetTag = document.getElementById('assetTag').value.trim();
        const assetType = document.getElementById('assetType').value;
        const serialNumber = document.getElementById('serialNumber').value.trim();

        if (!assetTag || !assetType || !serialNumber) {
            alert('Please fill in all required fields (marked with *)');
            return;
        }

        const assetData = {
            assetTag: assetTag,
            type: assetType,
            serialNumber: serialNumber,
            model: document.getElementById('model').value.trim() || null,
            condition: document.getElementById('condition').value || null,
            purchaseDate: document.getElementById('purchaseDate').value || null,
            purchaseCost: document.getElementById('purchaseCost').value || null,
            warrantyExpiry: document.getElementById('warrantyExpiry').value || null
        };

        try {
            let result;
            if (assetId) {
                // Update existing asset
                result = await authAPI.updateAsset(assetId, assetData);
            } else {
                // Add new asset
                result = await authAPI.addAsset(assetData);
            }
            
            if (result.success) {
                alert(assetId ? 'Asset updated successfully!' : 'Asset added successfully!');
                this.closeModal();
                this.loadAssets(); // Refresh the list
            } else {
                alert(`Failed to ${assetId ? 'update' : 'add'} asset: ${result.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(`Error ${assetId ? 'updating' : 'adding'} asset:`, error);
            alert(`Error ${assetId ? 'updating' : 'adding'} asset`);
        }
    }

    async deleteAsset(assetId) {
        if (!confirm('Are you sure you want to delete this asset?')) {
            return;
        }
        
        try {
            const result = await authAPI.deleteAsset(assetId);
            
            const ok = result && (result.success || result.status === 200);
            if (ok) {
                alert('Asset deleted successfully!');
                this.loadAssets(); // Refresh the list
            } else {
                alert(`Failed to delete asset: ${result?.data?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Error deleting asset');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ManageAssets();
});