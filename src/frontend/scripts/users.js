/**
 * User Management JavaScript
 * Handles user list display, edit, delete, and management
 */

const API_BASE_URL = 'http://127.0.0.1:5000/api';
let allUsers = [];
let editingUserId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadStatistics();

    // Event listeners
    document.getElementById('search-input').addEventListener('input', filterUsers);
    document.getElementById('sort-select').addEventListener('change', filterUsers);
    document.getElementById('close-modal').addEventListener('click', closeUserModal);
    document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
    document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);
    document.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeUserModal();
            closeEditModal();
        }
    });
});

// Load Users
async function loadUsers() {
    const loadingState = document.getElementById('loading-state');
    const usersList = document.getElementById('users-list');

    try {
        loadingState.style.display = 'flex';
        usersList.innerHTML = '';

        const response = await fetch(`${API_BASE_URL}/users`);
        const data = await response.json();

        if (data.success) {
            allUsers = data.data;
            filterUsers();
            loadStatistics();
        } else {
            showAlert('Failed to load users', 'error');
        }
    } catch (error) {
        console.error('Load users error:', error);
        showAlert('Unable to connect to server', 'error');
    } finally {
        loadingState.style.display = 'none';
    }
}

// Load Statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/stats/summary`);
        const data = await response.json();

        if (data.success) {
            const stats = data.data;

            // Update stat cards
            document.getElementById('total-users').textContent = stats.total_users;
            document.getElementById('user-count').textContent = `${stats.total_users} registered user${stats.total_users !== 1 ? 's' : ''}`;

            document.getElementById('average-age').textContent = stats.average_age || '0';

            // Latest user
            if (allUsers.length > 0) {
                const latest = allUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                document.getElementById('latest-user').textContent = latest.name;
                document.getElementById('latest-date').textContent = formatDate(latest.created_at);
            }
        }
    } catch (error) {
        console.error('Load statistics error:', error);
    }
}

// Filter and Display Users
function filterUsers() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortOption = document.getElementById('sort-select').value;

    let filtered = allUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.mobile.toLowerCase().includes(searchTerm);
        return matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
        switch (sortOption) {
            case 'date-desc':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'date-asc':
                return new Date(a.created_at) - new Date(b.created_at);
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'age-asc':
                return parseInt(a.age) - parseInt(b.age);
            case 'age-desc':
                return parseInt(b.age) - parseInt(a.age);
            default:
                return 0;
        }
    });

    displayUsers(filtered);
}

// Display Users
function displayUsers(users) {
    const container = document.getElementById('users-list');
    const emptyState = document.getElementById('empty-state');

    if (users.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = users.map(user => `
        <div class="user-item" onclick="viewUserDetails('${user.id}')">
            <div class="user-avatar-large">
                ${user.name.charAt(0).toUpperCase()}
            </div>
            <div class="user-info">
                <div class="user-header">
                    <h4 class="user-name">${escapeHtml(user.name)}</h4>
                    <span class="user-badge">Active</span>
                </div>
                <div class="user-meta">
                    <span>📧 ${escapeHtml(user.email)}</span>
                    <span>📱 ${escapeHtml(user.mobile)}</span>
                    <span>🎂 ${user.age} years</span>
                </div>
                <div class="user-meta">
                    <span>📍 ${escapeHtml(user.address)}</span>
                </div>
                <div class="user-id">
                    <span class="id-label">ID:</span>
                    <span class="id-value">${user.id}</span>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-icon btn-view" onclick="event.stopPropagation(); viewUserDetails('${user.id}')" title="View Details">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="btn btn-icon btn-edit" onclick="event.stopPropagation(); editUser('${user.id}')" title="Edit User">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="btn btn-icon btn-delete" onclick="event.stopPropagation(); deleteUser('${user.id}')" title="Delete User">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3 4.5H15M6 4.5V3C6 2.5 6.5 2 7 2H11C11.5 2 12 2.5 12 3V4.5M7.5 8.5V12.5M10.5 8.5V12.5M4.5 4.5H13.5V15C13.5 15.5 13 16 12.5 16H5.5C5 16 4.5 15.5 4.5 15V4.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// View User Details
async function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('user-modal');
    const detailsContainer = document.getElementById('user-details');

    detailsContainer.innerHTML = `
        <div class="user-details-content">
            <div class="user-avatar-xl">
                ${user.name.charAt(0).toUpperCase()}
            </div>
            <div class="detail-group">
                <label>Full Name</label>
                <div class="detail-value">${escapeHtml(user.name)}</div>
            </div>
            <div class="detail-group">
                <label>Email Address</label>
                <div class="detail-value">${escapeHtml(user.email)}</div>
            </div>
            <div class="detail-group">
                <label>Mobile Number</label>
                <div class="detail-value">${escapeHtml(user.mobile)}</div>
            </div>
            <div class="detail-group">
                <label>Age</label>
                <div class="detail-value">${user.age} years old</div>
            </div>
            <div class="detail-group">
                <label>Address</label>
                <div class="detail-value">${escapeHtml(user.address)}</div>
            </div>
            <div class="detail-group">
                <label>User ID</label>
                <div class="detail-value detail-id">${user.id}</div>
            </div>
            <div class="detail-group">
                <label>Registered On</label>
                <div class="detail-value">${formatDateLong(user.created_at)}</div>
            </div>
            <div class="detail-group">
                <label>Status</label>
                <div class="detail-value">
                    <span class="status-badge status-active">Active</span>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// Edit User
function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    editingUserId = userId;

    // Populate form
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-mobile').value = user.mobile;
    document.getElementById('edit-age').value = user.age;
    document.getElementById('edit-address').value = user.address;

    // Clear errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    // Show modal
    document.getElementById('edit-modal').classList.add('active');
}

// Handle Edit Submit
async function handleEditSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const mobile = document.getElementById('edit-mobile').value.trim();
    const age = document.getElementById('edit-age').value;
    const address = document.getElementById('edit-address').value.trim();
    const saveBtn = document.getElementById('save-user-btn');

    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    // Validation
    let hasError = false;

    if (!name || name.length < 2) {
        document.getElementById('edit-name-error').textContent = 'Name must be at least 2 characters';
        hasError = true;
    }

    if (!email || !validateEmail(email)) {
        document.getElementById('edit-email-error').textContent = 'Invalid email address';
        hasError = true;
    }

    if (!mobile || !validateMobile(mobile)) {
        document.getElementById('edit-mobile-error').textContent = 'Invalid mobile number';
        hasError = true;
    }

    if (!age || parseInt(age) < 1 || parseInt(age) > 150) {
        document.getElementById('edit-age-error').textContent = 'Age must be between 1 and 150';
        hasError = true;
    }

    if (!address || address.length < 5) {
        document.getElementById('edit-address-error').textContent = 'Address must be at least 5 characters';
        hasError = true;
    }

    if (hasError) return;

    setLoading(saveBtn, true);

    try {
        const response = await fetch(`${API_BASE_URL}/users/${editingUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, mobile, age: parseInt(age), address })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('User updated successfully', 'success');
            closeEditModal();
            loadUsers();
        } else {
            showAlert(data.error || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
        showAlert('Unable to connect to server', 'error');
    } finally {
        setLoading(saveBtn, false);
    }
}

// Delete User
async function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Are you sure you want to delete ${user.name}?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('User deleted successfully', 'success');
            loadUsers();
        } else {
            showAlert(data.error || 'Delete failed', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Unable to connect to server', 'error');
    }
}

// Close Modals
function closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    editingUserId = null;
}

// Utility Functions
function showAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
        button.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        button.disabled = false;
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateMobile(mobile) {
    const digits = mobile.replace(/\D/g, '');
    return digits.length >= 10;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDateLong(dateStr) {
    const date = new Date(dateStr);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible
window.viewUserDetails = viewUserDetails;
window.editUser = editUser;
window.deleteUser = deleteUser;
