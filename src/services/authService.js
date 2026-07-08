/**
 * Processwallah OCR Engine V1.0 - Core Authentication & Profile Service
 * Version 1.0.0
 * Manages all authentication operations via Supabase Auth services.
 */

const AuthService = {
    /**
     * Authenticates a user session
     * Automatically resolves username inputs to registered system emails
     * @param {string} usernameOrEmail User-entered username or email
     * @param {string} password Account password
     * @returns {Promise<Object>} The authenticated session object
     */
    async login(usernameOrEmail, password) {
        if (!window.supabaseClient) {
            throw new Error("API Link Offline. Please configure your API URL and keys in Settings.");
        }

        let email = usernameOrEmail.trim();

        // Automatically map username inputs (like 'Arshi') to system email domains
        if (!email.includes('@')) {
            email = `${email.toLowerCase()}@processwallah.com`;
        }

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error("Login authorization failed:", error.message);
            throw new Error(error.message);
        }

        // Write audit log entry
        try {
            await this.logActivity(data.user.id, 'Login', 'profiles', data.user.id, `User session started: ${email}`);
        } catch (logErr) {
            console.warn("Failed to write system audit log:", logErr);
        }

        return data;
    },

    /**
     * Terminates the active session and logs the user out
     */
    async logout() {
        if (!window.supabaseClient) return;

        const user = await this.getCurrentUser();
        if (user) {
            try {
                await this.logActivity(user.id, 'Logout', 'profiles', user.id, `User session terminated.`);
            } catch (e) {
                // Fail silently on log errors during logout
            }
        }

        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
            console.error("Sign-out process interrupted:", error.message);
            throw error;
        }

        // Clear active session states
        console.log("Logged out successfully.");
    },

    /**
     * Retrieves the current authenticated user session data
     * @returns {Promise<Object|null>} Current user payload or null if unauthenticated
     */
    async getCurrentUser() {
        if (!window.supabaseClient) return null;
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        if (error || !user) return null;
        return user;
    },

    /**
     * Merges user session metadata with values from public profiles
     * @returns {Promise<Object|null>} Profile payload merge data or null
     */
    async getUserProfile() {
        if (!window.supabaseClient) return null;

        const user = await this.getCurrentUser();
        if (!user) return null;

        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error("Profile resolution failed:", error.message);
            throw error;
        }

        return data;
    },

    /**
     * Helper function to log user activity and operations to the audit table
     */
    async logActivity(userId, actionType, targetTable, recordId, message) {
        if (!window.supabaseClient) return;
        
        await window.supabaseClient.from('system_activity_logs').insert([{
            triggered_by: userId,
            action_type: actionType,
            target_table: targetTable,
            record_id: recordId,
            message: message
        }]);
    }
};

// Bind to window context
window.AuthService = AuthService;
