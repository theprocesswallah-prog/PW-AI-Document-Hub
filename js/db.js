/**
 * Processwallah OCR Engine V1.0 - Database Connection Gateway
 * Version 1.0.1
 * Establishes and manages direct, secure connections to the Supabase PostgreSQL database.
 */

const DatabaseConnector = {
    client: null,

    /**
     * Instantiates the Supabase connection client from configurations stored in Settings
     */
    initialize() {
        const supabaseUrl = localStorage.getItem('PROCESSWALLAH_SUPABASE_URL') || '';
        const supabaseKey = localStorage.getItem('PROCESSWALLAH_SUPABASE_KEY') || '';

        if (!supabaseUrl || !supabaseKey) {
            console.warn("Database Connection Mapped Offline: Complete connection URL and API Keys inside the Settings Workspace.");
            this.client = null;
            window.supabaseClient = null;
            return null;
        }

        try {
            // Verify that the external client library CDN is loaded before initializing
            if (typeof supabase !== 'undefined') {
                this.client = supabase.createClient(supabaseUrl, supabaseKey);
                window.supabaseClient = this.client;
                console.log("Central Supabase Client initialized successfully.");
                return this.client;
            } else {
                throw new Error("Supabase library script missing. Please include direct CDN components.");
            }
        } catch (err) {
            console.error("Database connection initialization failed:", err);
            this.client = null;
            window.supabaseClient = null;
            return null;
        }
    },

    /**
     * Connection verification helper
     * @returns {boolean} True if connected
     */
    isConnected() {
        return this.client !== null;
    }
};

// Expose helper to global scope for dynamic page queries
window.DatabaseConnector = DatabaseConnector;
window.getApiBaseUrl = function() {
    return localStorage.getItem('PROCESSWALLAH_SUPABASE_URL') || '';
};

document.addEventListener('DOMContentLoaded', () => {
    DatabaseConnector.initialize();
});
