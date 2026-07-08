/**
 * Processwallah OCR Engine V1.0 - Core Application Bootstrap Controller
 * Version 1.0.0
 * Initializes dynamic state variables, audits connectivity latency, and manages user sessions.
 */

const AppManager = {
    async initialize() {
        this.bindGlobalEvents();
        await this.initializeActiveSession();
        this.runDiagnosticsPerformancePing();
    },

    bindGlobalEvents() {
        const sidebar = document.getElementById('appSidebar');
        const menuToggle = document.getElementById('menuToggle');

        // Sidebar responsive menu toggles
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.innerWidth > 1024) {
                    sidebar.classList.toggle('collapsed');
                    localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
                } else {
                    sidebar.classList.toggle('open');
                }
            });
        }
    },

    /**
     * Resolves authenticated user sessions and updates layout headers
     */
    async initializeActiveSession() {
        if (!window.supabaseClient) {
            console.warn("Client Offline: Connecting database configurations via Settings dashboard.");
            return;
        }

        try {
            const user = await window.AuthService.getCurrentUser();
            if (user) {
                const profile = await window.AuthService.getUserProfile();
                if (profile) {
                    // Update user details in header
                    const headerName = document.getElementById('globalProfileHeaderName');
                    const headerRole = document.getElementById('globalProfileHeaderRole');
                    const headerAvatar = document.getElementById('globalProfileHeaderAvatar');

                    if (headerName) headerName.innerText = profile.display_name || profile.username;
                    if (headerRole) headerRole.innerText = profile.role;
                    if (headerAvatar) {
                        const nameString = profile.display_name || profile.username || 'G';
                        headerAvatar.innerText = nameString.charAt(0).toUpperCase();
                    }
                }
            }
        } catch (err) {
            console.error("Session profile alignment interrupted:", err.message);
        }
    },

    /**
     * Measures database API connection response time
     */
    async runDiagnosticsPerformancePing() {
        const pingIndicator = document.getElementById('latencyCheckIndicator');
        if (!pingIndicator) return;

        if (!window.supabaseClient) {
            pingIndicator.innerText = "Offline";
            pingIndicator.style.color = "#EF4444";
            return;
        }

        const startTimestamp = performance.now();
        try {
            // Run a lightweight query to measure latency
            await window.supabaseClient.from('profiles').select('profile_id').limit(1);
            const latency = Math.round(performance.now() - startTimestamp);
            pingIndicator.innerText = `${latency} ms`;
            pingIndicator.style.color = latency > 300 ? "#F59E0B" : "#10B981";
        } catch (e) {
            pingIndicator.innerText = "Error";
            pingIndicator.style.color = "#EF4444";
        }
    }
};

// Expose configuration globally
window.AppManager = AppManager;

document.addEventListener('DOMContentLoaded', () => {
    AppManager.initialize();
});
