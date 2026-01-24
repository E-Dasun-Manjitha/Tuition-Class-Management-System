/**
 * EduPhysics Academy - Frontend Configuration
 * ============================================
 * This file automatically detects the environment and uses the correct API URL
 * 
 * For Local Development: Uses http://127.0.0.1:5000/api
 * For Production (Vercel + Render): Uses the Render backend URL
 */

// Detect if running locally or in production
const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('5500');

// ⚠️ IMPORTANT: Replace this with your actual Render backend URL!
// Get your URL from: Render Dashboard → Your Service → Settings → URL
const RENDER_BACKEND_URL = 'https://eduphysics-api.onrender.com';

const CONFIG = {
    // ===========================================
    // API Configuration
    // ===========================================

    // Backend API URL - Automatically switches between local and production
    API_BASE_URL: isLocalhost
        ? 'http://127.0.0.1:5000/api'
        : `${RENDER_BACKEND_URL}/api`,

    // API request timeout (milliseconds)
    API_TIMEOUT: 30000,

    // ===========================================
    // Cloudinary Configuration (Optional)
    // ===========================================
    // Only needed if using direct frontend uploads

    CLOUDINARY: {
        CLOUD_NAME: 'dlggkuday',      // From Cloudinary Dashboard
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
