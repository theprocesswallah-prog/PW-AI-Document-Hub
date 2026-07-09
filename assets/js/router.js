/**
 * Processwallah OCR Engine V1.0 - Central SPA Client Router
 * Version 1.0.2
 * Handles dynamic routing, session guards, and deferred script executions.
 */

const AppRouter = {
    // Route mappings to target physical HTML page files
    routes: {
        '#/login': { path: 'pages/login.html', title: 'Security Gateway', authed: false },
        '#/dashboard': { path: 'pages/dashboard.html', title: 'Dashboard', authed: true },
        '#/sales/upload': { path: 'pages/sales/upload.html', title: 'Sales AI Upload', authed: true },
        '#/sales/register': { path: 'pages/sales/register.html', title: 'Sales Invoice Register', authed: true },
        '#/purchase/upload': { path: 'pages/purchase/upload.html', title: 'Purchase Bill Upload', authed: true },
        '#/purchase/register': { path: 'pages/purchase/register.html', title: 'Purchase Ledger Register', authed: true },
        '#/masters/customer': { path: 'pages/masters/customer.html', title: 'Customer Master', authed: true },
        '#/masters/vendor': { path: 'pages/masters/vendor.html', title: 'Vendor Master', authed: true },
        '#/masters/product': { path: 'pages/masters/product.html', title: 'Product Catalog Master', authed: true },
        '#/masters/item': { path: 'pages/masters/item.html', title: 'Raw Material Master', authed: true },
        '#/settings': { path: 'pages/settings.html', title: 'Configurations settings', authed: true },
        '#/profile': { path: 'pages/profile.html', title: 'User Account Profile', authed: true }
    },

    initialize() {
        // Monitor hash transitions
        window.addEventListener('hashchange', () => this.evaluateRouteTransition());
        window.addEventListener('load', () => this.evaluateRouteTransition());
        
        // Initial routing fallback
        if (!window.location.hash) {
            // DEVELOPMENT MODE - Authentication temporarily bypassed until Settings module is completed.
            window.location.hash = window.DEVELOPMENT_MODE === true ? '#/dashboard' : '#/login';
        }
    },

    async evaluateRouteTransition() {
        const activeHash = window.location.hash || '#/login';
        const targetRoute = this.routes[activeHash];

        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('active');

        // 1. Unrecognized route fallback
        if (!targetRoute) {
            console.error(`Route "${activeHash}" is not registered in the system map.`);
            window.location.hash = '#/dashboard';
            return;
        }

        // DEVELOPMENT MODE - Authentication temporarily bypassed until Settings module is completed.
        const bypassAuth = window.DEVELOPMENT_MODE === true;

        if (activeHash === '#/login' && bypassAuth) {
            window.location.hash = '#/dashboard';
            return;
        }

        // 2. Authentication and Session Guards
        let isSessionAuthenticated = false;
        if (window.AuthService && !bypassAuth) {
            const user = await window.AuthService.getCurrentUser();
            isSessionAuthenticated = user !== null;
        }

        if (targetRoute.authed && !isSessionAuthenticated && !bypassAuth) {
            console.warn("Unauthenticated Access Refused. Redirecting to login portal.");
            window.location.hash = '#/login';
            return;
        }

        if (!targetRoute.authed && isSessionAuthenticated && activeHash === '#/login' && !bypassAuth) {
            console.log("Active session authenticated. Redirecting to dashboard.");
            window.location.hash = '#/dashboard';
            return;
        }

        // 3. Layout Viewport Rendering
        const appShell = document.getElementById('appShellContainer');
        const authShell = document.getElementById('unauthenticatedViewport');
        const contentTargetId = (targetRoute.authed || bypassAuth) ? 'mainContentViewport' : 'unauthenticatedViewport';

        if (targetRoute.authed || bypassAuth) {
            appShell.style.display = 'flex';
            authShell.style.display = 'none';
        } else {
            appShell.style.display = 'none';
            authShell.style.display = 'block';
        }

        // 4. Fetch and Load the Page HTML Fragment
        try {
            const viewport = document.getElementById(contentTargetId);
            const response = await fetch(targetRoute.path);
            
            if (!response.ok) {
                throw new Error(`Failed to load page resource: ${response.statusText}`);
            }

            const htmlFragment = await response.text();
            viewport.innerHTML = htmlFragment;

            // Update page headers
            const headerBreadcrumb = document.getElementById('currentBreadcrumbHeader');
            if (headerBreadcrumb) headerBreadcrumb.innerText = targetRoute.title;

            // Highlight the active sidebar navigation link
            this.highlightSidebarLink(activeHash);

            // Execute scripts inside the loaded page fragment
            this.executePageFragmentScripts(viewport);

            // Trigger standard page loader completion
            if (loader) loader.classList.remove('active');

        } catch (err) {
            console.error("Failed to load routed layout container view:", err);
            if (window.NotificationService) {
                window.NotificationService.showError("Failed to render routed page layout.");
            }
            if (loader) loader.classList.remove('active');
        }
    },

    highlightSidebarLink(activeHash) {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === activeHash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    /**
     * Programmatic evaluation of script tags inside injected DOM elements
     * Incorporates deferred removal to avoid compilation race conditions.
     */
    executePageFragmentScripts(containerElement) {
        const scripts = containerElement.querySelectorAll('script');
        scripts.forEach(script => {
            const executableScript = document.createElement('script');
            if (script.src) {
                executableScript.src = script.src;
            } else {
                executableScript.textContent = script.textContent;
            }
            document.body.appendChild(executableScript);
            
            // Non-blocking timeout allows browser thread to parse and compile textContent before element removal
            setTimeout(() => {
                executableScript.remove();
            }, 100);
        });
    }
};

// Bind configuration helper to window context
window.AppRouter = AppRouter;

document.addEventListener('DOMContentLoaded', () => {
    AppRouter.initialize();
});
