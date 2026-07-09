/**
 * Processwallah OCR Engine V1.0 - Central Supabase Client Engine
 * Version 1.0.2
 * Dynamically instantiates the global client connection when credentials update.
 */

const SupabaseConfig = {
    /**
     * Initializes the client connection from saved browser credentials
     * @returns {Object|null} Authorized Supabase Client instance or null
     */
    initializeClient() {
        const url = localStorage.getItem('PROCESSWALLAH_SUPABASE_URL') || '';
        const anonKey = localStorage.getItem('PROCESSWALLAH_SUPABASE_KEY') || '';

        if (!url || !anonKey) {
            console.warn("Supabase Configuration Offline: Missing target API URL or Public Anonymous Key in settings.");
            window.supabaseClient = null;
            return null;
        }

        try {
            if (typeof supabase !== 'undefined') {
                // Initialize/Re-initialize client
                const client = supabase.createClient(url, anonKey, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                });
                
                window.supabaseClient = client;
                console.log("Central Supabase client connected successfully.");
                return client;
            } else {
                throw new Error("Supabase JS SDK script missing. Ensure the Supabase CDN is included.");
            }
        } catch (err) {
            console.error("Failed to initialize central Supabase Client:", err);
            window.supabaseClient = null;
            return null;
        }
    }
};

window.SupabaseConfig = SupabaseConfig;

// Initialize automatically on startup
document.addEventListener('DOMContentLoaded', () => {
    SupabaseConfig.initializeClient();
});
