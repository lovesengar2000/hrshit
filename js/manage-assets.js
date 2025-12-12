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
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.backToDashboard = document.getElementById('backToDashboard');
        this.addAssetBtn = document.getElementById('addAssetBtn');
        this.typeFilter = document.getElementById('typeFilter');
        this.searchAssets = document.getElementById('searchAssets');
        
        // Modal elements
        this.modal = document.getElementById('assetModal');
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        this.assetForm = document.getElementById('assetForm');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalSubmitBtn = document.getElementById('modalSubmitBtn');

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

    closeModal() {
        this.modal.style.display = 'none';
        this.assetForm.reset();
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
            
            if (result.success) {
                alert('Asset deleted successfully!');
                this.loadAssets(); // Refresh the list
            } else {
                alert(`Failed to delete asset: ${result.data?.message || 'Unknown error'}`);
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