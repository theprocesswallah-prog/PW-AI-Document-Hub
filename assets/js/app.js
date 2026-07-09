/**
 * Processwallah OCR Engine V1.0 - Central Bootstrapper
 * Version 1.0.2
 * Manages active user sessions, measures connection performance, and handles UI updates.
 */

// DEVELOPMENT MODE - Authentication temporarily bypassed until Settings module is completed.
window.DEVELOPMENT_MODE = true; 

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
        // DEVELOPMENT MODE - Authentication temporarily bypassed until Settings module is completed.
        if (window.DEVELOPMENT_MODE === true) {
            console.log("%cDEVELOPMENT_MODE Active: Security session checks bypassed.", "color: orange; font-weight: bold;");
            const headerName = document.getElementById('globalProfileHeaderName');
            const headerRole = document.getElementById('globalProfileHeaderRole');
            const headerAvatar = document.getElementById('globalProfileHeaderAvatar');

            if (headerName) headerName.innerText = "Arshi (Dev)";
            if (headerRole) headerRole.innerText = "Admin";
            if (headerAvatar) headerAvatar.innerText = "A";
            return;
        }

        if (!window.supabaseClient) {
            console.warn("Client Connection Offline. Configure credentials in the Settings panel.");
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
            } else {
                // If the user navigates directly without an active session, redirect to the login page
                if (window.location.hash !== '#/login') {
                    window.location.hash = '#/login';
                }
            }
        } catch (err) {
            console.error("Session profile alignment interrupted:", err.message);
        }
    },

    /**
     * Terminate active user sessions securely
     */
    async logoutSessionAction() {
        // DEVELOPMENT MODE - Authentication temporarily bypassed until Settings module is completed.
        if (window.DEVELOPMENT_MODE === true) {
            if (window.NotificationService) {
                window.NotificationService.showSuccess("Development session terminated.");
            }
            setTimeout(() => {
                window.location.hash = '#/login';
            }, 500);
            return;
        }

        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('active');

        try {
            if (window.AuthService) {
                await window.AuthService.logout();
                if (window.NotificationService) {
                    window.NotificationService.showSuccess("User session terminated.");
                }
                
                // Clear header values on logout
                document.getElementById('globalProfileHeaderName').innerText = "Guest Identity";
                document.getElementById('globalProfileHeaderRole').innerText = "Offline";
                document.getElementById('globalProfileHeaderAvatar').innerText = "G";

                setTimeout(() => {
                    window.location.hash = '#/login';
                }, 500);
            }
        } catch (err) {
            console.error("Sign out failed:", err.message);
            if (window.NotificationService) {
                window.NotificationService.showError("Failed to log out securely.");
            }
        } finally {
            if (loader) loader.classList.remove('active');
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
