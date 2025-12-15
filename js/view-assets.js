// View Assets functionality for users
class ViewAssets {
    constructor() {
        this.init();
    }

    init() {
        // Check authentication
        if (!authAPI.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Admins should use manage-assets.html instead
        if (authAPI.isAdmin()) {
            window.location.href = 'manage-assets.html';
            return;
        }

        this.bindEvents();
        this.loadUserAssets();
    }

    bindEvents() {
        this.logoutBtn = document.getElementById('logoutBtn');
        this.backToDashboard = document.getElementById('backToDashboard');

        this.logoutBtn.addEventListener('click', () => authAPI.logout());
        this.backToDashboard.addEventListener('click', () => window.location.href = 'dashboard.html');
    }

    async loadUserAssets() {
        const loadingEl = document.getElementById('loadingUserAssets');
        const noAssetsEl = document.getElementById('noUserAssets');
        const tableBody = document.getElementById('userAssetsTableBody');

        if (loadingEl) loadingEl.style.display = 'block';
        if (noAssetsEl) noAssetsEl.style.display = 'none';
        if (tableBody) tableBody.innerHTML = '';

        try {
            // Get current user
            const user = authAPI.getCurrentUser();
            if (!user || !user.userId) {
                throw new Error('User not found');
            }

            // Get the current user's employeeId
            const employeeId = await authAPI.getCurrentUserEmployeeId();
            console.log('Current user employeeId:', employeeId);

            // Fetch assigned assets filtered by this user's employeeId
            const result = await authAPI.getAssignedAssets(employeeId);
            
            if (loadingEl) loadingEl.style.display = 'none';
            
            if (result.success && result.data && Array.isArray(result.data)) {
                if (result.data.length > 0) {
                    this.displayUserAssets(result.data);
                } else {
                    if (noAssetsEl) noAssetsEl.style.display = 'block';
                }
            } else {
                if (noAssetsEl) noAssetsEl.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading user assets:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (noAssetsEl) noAssetsEl.style.display = 'block';
        }
    }

    displayUserAssets(assets) {
        const tableBody = document.getElementById('userAssetsTableBody');
        if (!tableBody) return;

        if (assets.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        No assets assigned to you.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = assets.map(asset => `
            <tr data-assignment-id="${asset.assignmentId || ''}">
                <td><strong>${asset.assetTag || 'N/A'}</strong></td>
                <td>${asset.type || 'N/A'}</td>
                <td>${asset.model || 'N/A'}</td>
                <td>${asset.serialNumber || 'N/A'}</td>
                <td>
                    <span class="condition-badge ${(asset.condition || '').toLowerCase()}">
                        ${asset.condition || 'Unknown'}
                    </span>
                </td>
                <td>${asset.assignedAt ? new Date(asset.assignedAt).toLocaleDateString() : 'N/A'}</td>
                <td>${asset.notes || '-'}</td>
            </tr>
        `).join('');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ViewAssets();
});
