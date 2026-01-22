/**
 * EduPhysics Academy - Authentication Module
 * Handles session management and logout functionality
 */

// Check authentication status
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Initialize auth on protected pages
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    initializeLogout();
    initializeNavigation();
});

// Logout functionality
function initializeLogout() {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('loginTime');
                window.location.href = 'index.html';
            }
        });
    }
}

// Navigation for dashboard pages
function initializeNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// Session timeout check (optional - 30 minutes)
function checkSessionTimeout() {
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
        const now = new Date();
        const login = new Date(loginTime);
        const diffMinutes = (now - login) / (1000 * 60);

        if (diffMinutes > 30) {
            alert('Your session has expired. Please login again.');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loginTime');
            window.location.href = 'index.html';
        }
    }
}

// Export functions for use in other scripts
window.auth = {
    checkAuth,
    checkSessionTimeout
};
