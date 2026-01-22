/**
 * EduPhysics Academy - API Configuration
 * Central configuration for API endpoints
 * 
 * NOTE: Edit config.js to change the API_BASE_URL
 */

// Get base URL from config (config.js must be loaded before this file)
const getBaseUrl = () => {
    if (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) {
        return CONFIG.API_BASE_URL;
    }
    // Fallback for local development
    return 'http://127.0.0.1:5000/api';
};

// API Configuration
const API_CONFIG = {
    // Base URL from config.js
    BASE_URL: getBaseUrl(),

    // Endpoints
    ENDPOINTS: {
        // Auth
        LOGIN: '/auth/login',

        // Students
        STUDENTS: '/students',

        // Analytics
        ANALYTICS: '/analytics/overview',
        FINANCE: '/analytics/finance',

        // Health
        HEALTH: '/health'
    }
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// API Methods
const api = {
    // Auth
    login: (username, password) => apiCall(API_CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password })
    }),

    // Students
    getStudents: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString
            ? `${API_CONFIG.ENDPOINTS.STUDENTS}?${queryString}`
            : API_CONFIG.ENDPOINTS.STUDENTS;
        return apiCall(endpoint);
    },

    getStudent: (id) => apiCall(`${API_CONFIG.ENDPOINTS.STUDENTS}/${id}`),

    createStudent: (studentData) => apiCall(API_CONFIG.ENDPOINTS.STUDENTS, {
        method: 'POST',
        body: JSON.stringify(studentData)
    }),

    updateStudent: (id, studentData) => apiCall(`${API_CONFIG.ENDPOINTS.STUDENTS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(studentData)
    }),

    deleteStudent: (id) => apiCall(`${API_CONFIG.ENDPOINTS.STUDENTS}/${id}`, {
        method: 'DELETE'
    }),

    // Public Student Registration (with payment receipt)
    createStudentRegistration: (studentData) => apiCall('/students/register', {
        method: 'POST',
        body: JSON.stringify(studentData)
    }),

    // Analytics
    getAnalytics: () => apiCall(API_CONFIG.ENDPOINTS.ANALYTICS),
    getFinanceAnalytics: () => apiCall(API_CONFIG.ENDPOINTS.FINANCE),

    // Health check
    healthCheck: () => apiCall(API_CONFIG.ENDPOINTS.HEALTH)
};

// Export for use in other scripts
window.API_CONFIG = API_CONFIG;
window.api = api;
