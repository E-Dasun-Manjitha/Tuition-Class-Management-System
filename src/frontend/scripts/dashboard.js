/**
 * Dashboard JavaScript
 * Handles expense management, statistics, and UI interactions
 */

const API_BASE_URL = 'http://127.0.0.1:5000/api';
let currentUser = null;
let allExpenses = [];
let editingExpenseId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'welcome.html';
        return;
    }

    currentUser = JSON.parse(userStr);
    initializeDashboard();
});

// Initialize Dashboard
function initializeDashboard() {
    // Set user info
    document.getElementById('user-name').textContent = currentUser.username;
    document.getElementById('user-avatar').textContent = currentUser.username.charAt(0).toUpperCase();

    // Load expenses
    loadExpenses();

    // Event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('add-expense-btn').addEventListener('click', () => openExpenseModal());
    document.getElementById('close-modal').addEventListener('click', closeExpenseModal);
    document.getElementById('cancel-btn').addEventListener('click', closeExpenseModal);
    document.getElementById('expense-form').addEventListener('submit', handleExpenseSubmit);
    document.getElementById('search-input').addEventListener('input', filterExpenses);
    document.getElementById('category-filter').addEventListener('change', filterExpenses);
    document.getElementById('sort-select').addEventListener('change', filterExpenses);

    // Close modal on overlay click
    document.querySelector('.modal-overlay').addEventListener('click', closeExpenseModal);

    // Set default date to today
    document.getElementById('expense-date').valueAsDate = new Date();
}

// Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'welcome.html';
}

// Load Expenses
async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/expenses?user_id=${currentUser.id}`);
        const data = await response.json();

        if (data.success) {
            allExpenses = data.data;
            filterExpenses();
            loadStatistics();
        } else {
            showAlert('Failed to load expenses', 'error');
        }
    } catch (error) {
        console.error('Load expenses error:', error);
        showAlert('Unable to connect to server', 'error');
    }
}

// Load Statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/expenses/stats/${currentUser.id}`);
        const data = await response.json();

        if (data.success) {
            const stats = data.data;

            // Update stat cards
            document.getElementById('total-expenses').textContent = `$${stats.total_amount.toFixed(2)}`;
            document.getElementById('expense-count').textContent = `${stats.total_expenses} expense${stats.total_expenses !== 1 ? 's' : ''}`;

            document.getElementById('monthly-expenses').textContent = `$${stats.monthly_total.toFixed(2)}`;
            document.getElementById('monthly-count').textContent = `${stats.monthly_count} expense${stats.monthly_count !== 1 ? 's' : ''}`;

            // Top category
            const categories = stats.categories;
            if (Object.keys(categories).length > 0) {
                const topCategory = Object.entries(categories).sort((a, b) => b[1].total - a[1].total)[0];
                document.getElementById('top-category').textContent = getCategoryIcon(topCategory[0]) + ' ' + topCategory[0];
                document.getElementById('top-category-amount').textContent = `$${topCategory[1].total.toFixed(2)}`;
            } else {
                document.getElementById('top-category').textContent = '-';
                document.getElementById('top-category-amount').textContent = '$0.00';
            }
        }
    } catch (error) {
        console.error('Load statistics error:', error);
    }
}

// Filter and Display Expenses
function filterExpenses() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const sortOption = document.getElementById('sort-select').value;

    let filtered = allExpenses.filter(expense => {
        const matchesSearch = expense.title.toLowerCase().includes(searchTerm) ||
            expense.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || expense.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
        switch (sortOption) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'amount-desc':
                return parseFloat(b.amount) - parseFloat(a.amount);
            case 'amount-asc':
                return parseFloat(a.amount) - parseFloat(b.amount);
            default:
                return 0;
        }
    });

    displayExpenses(filtered);
}

// Display Expenses
function displayExpenses(expenses) {
    const container = document.getElementById('expenses-list');
    const emptyState = document.getElementById('empty-state');

    if (expenses.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = expenses.map(expense => `
        <div class="expense-item" data-id="${expense.id}">
            <div class="expense-info">
                <div class="expense-header">
                    <span class="expense-category-badge">${getCategoryIcon(expense.category)} ${expense.category}</span>
                    <h4 class="expense-title">${escapeHtml(expense.title)}</h4>
                </div>
                <div class="expense-meta">
                    <span>📅 ${formatDate(expense.date)}</span>
                    ${expense.description ? `<span>📝 ${escapeHtml(expense.description)}</span>` : ''}
                </div>
            </div>
            <div class="expense-actions">
                <span class="expense-amount">$${parseFloat(expense.amount).toFixed(2)}</span>
                <button class="btn btn-icon btn-edit" onclick="editExpense('${expense.id}')">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M12.5 2.5L15.5 5.5L6 15H3V12L12.5 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button class="btn btn-icon btn-delete" onclick="deleteExpense('${expense.id}')">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3 4.5H15M6 4.5V3C6 2.5 6.5 2 7 2H11C11.5 2 12 2.5 12 3V4.5M7.5 8.5V12.5M10.5 8.5V12.5M4.5 4.5H13.5V15C13.5 15.5 13 16 12.5 16H5.5C5 16 4.5 15.5 4.5 15V4.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Open Expense Modal
function openExpenseModal(expense = null) {
    const modal = document.getElementById('expense-modal');
    const form = document.getElementById('expense-form');

    // Reset form
    form.reset();
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    if (expense) {
        // Edit mode
        document.getElementById('modal-title').textContent = 'Edit Expense';
        document.getElementById('expense-id').value = expense.id;
        document.getElementById('expense-title').value = expense.title;
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-category').value = expense.category;
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-description').value = expense.description;
        document.getElementById('save-expense-btn').querySelector('.btn-text').textContent = 'Update Expense';
        editingExpenseId = expense.id;
    } else {
        // Add mode
        document.getElementById('modal-title').textContent = 'Add Expense';
        document.getElementById('expense-date').valueAsDate = new Date();
        document.getElementById('save-expense-btn').querySelector('.btn-text').textContent = 'Save Expense';
        editingExpenseId = null;
    }

    modal.classList.add('active');
}

// Close Expense Modal
function closeExpenseModal() {
    const modal = document.getElementById('expense-modal');
    modal.classList.remove('active');
    editingExpenseId = null;
}

// Handle Expense Submit
async function handleExpenseSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('expense-title').value.trim();
    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const description = document.getElementById('expense-description').value.trim();
    const saveBtn = document.getElementById('save-expense-btn');

    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    // Validation
    let hasError = false;

    if (!title || title.length < 3) {
        document.getElementById('title-error').textContent = 'Title must be at least 3 characters';
        hasError = true;
    }

    if (!amount || parseFloat(amount) <= 0) {
        document.getElementById('amount-error').textContent = 'Amount must be greater than 0';
        hasError = true;
    }

    if (!category) {
        document.getElementById('category-error').textContent = 'Please select a category';
        hasError = true;
    }

    if (!date) {
        document.getElementById('date-error').textContent = 'Date is required';
        hasError = true;
    }

    if (hasError) return;

    // Prepare data
    const expenseData = {
        user_id: currentUser.id,
        title,
        amount: parseFloat(amount),
        category,
        date,
        description
    };

    setLoading(saveBtn, true);

    try {
        let response;

        if (editingExpenseId) {
            // Update existing expense
            response = await fetch(`${API_BASE_URL}/expenses/${editingExpenseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData)
            });
        } else {
            // Create new expense
            response = await fetch(`${API_BASE_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(expenseData)
            });
        }

        const data = await response.json();

        if (data.success) {
            showAlert(data.message, 'success');
            closeExpenseModal();
            loadExpenses();
        } else {
            showAlert(data.error || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Expense submit error:', error);
        showAlert('Unable to connect to server', 'error');
    } finally {
        setLoading(saveBtn, false);
    }
}

// Edit Expense
function editExpense(expenseId) {
    const expense = allExpenses.find(e => e.id === expenseId);
    if (expense) {
        openExpenseModal(expense);
    }
}

// Delete Expense
async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Expense deleted successfully', 'success');
            loadExpenses();
        } else {
            showAlert(data.error || 'Delete failed', 'error');
        }
    } catch (error) {
        console.error('Delete expense error:', error);
        showAlert('Unable to connect to server', 'error');
    }
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

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getCategoryIcon(category) {
    const icons = {
        'Food': '🍔',
        'Transport': '🚗',
        'Shopping': '🛍️',
        'Entertainment': '🎬',
        'Bills': '📄',
        'Health': '🏥',
        'Other': '📦'
    };
    return icons[category] || '📦';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
