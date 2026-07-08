/**
 * Processwallah OCR Engine V1.0 - Central Supabase Client Engine
 * Version 1.0.0
 * Initializes the client connection from verified local configuration states.
 */

const SupabaseConfig = {
    /**
     * Initializes the client connection
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
                // Initialize client
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

// Bind configuration helper to window context
window.SupabaseConfig = SupabaseConfig;

// Initialize when library and DOM are loaded
document.addEventListener('DOMContentLoaded', () => {
    SupabaseConfig.initializeClient();
});
