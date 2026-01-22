/**
 * EduPhysics Academy - Frontend Configuration
 * ============================================
 * Edit this file to configure your API endpoints
 * 
 * For Local Development:
 *   API_BASE_URL: 'http://127.0.0.1:5000/api'
 * 
 * For Production (after Render deployment):
 *   API_BASE_URL: 'https://your-backend.onrender.com/api'
 */

const CONFIG = {
    // ===========================================
    // API Configuration
    // ===========================================

    // Backend API URL - CHANGE THIS FOR PRODUCTION!
    API_BASE_URL: 'http://127.0.0.1:5000/api',

    // API request timeout (milliseconds)
    API_TIMEOUT: 30000,

    // ===========================================
    // Cloudinary Configuration (Optional)
    // ===========================================
    // Only needed if using direct frontend uploads

    CLOUDINARY: {
        CLOUD_NAME: 'your_cloud_name',      // From Cloudinary Dashboard
        UPLOAD_PRESET: 'eduphysics_receipts' // Create in Cloudinary Settings
    },

    // ===========================================
    // Application Settings
    // ===========================================

    APP: {
        NAME: 'EduPhysics Academy',
        VERSION: '1.0.0',
        MAX_FILE_SIZE: 5 * 1024 * 1024,  // 5MB max for receipt uploads
        SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf']
    }
};

// Make config available globally
window.CONFIG = CONFIG;

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
