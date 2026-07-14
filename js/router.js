/**
 * Processwallah OCR Engine V1.0 - Central SPA Client Router (Realigned Layout)
 * Version 1.0.4
 * Directly maps routing requests to physical folder structures, bypassing auth requirements.
 */

const AppRouter = {
    // Realigned routes mapping to flat pages files
    routes: {
        '#/dashboard': { path: 'pages/dashboard.html', title: 'Dashboard' },
        '#/sales/upload': { path: 'pages/universal-workspace.html?type=sales-invoice', title: 'Sales AI Upload' },
        '#/sales/register': { path: 'pages/sales-register.html', title: 'Sales Invoice Register' },
        '#/purchase/upload': { path: 'pages/universal-workspace.html?type=purchase-invoice', title: 'Purchase Bill Upload' },
        '#/purchase/register': { path: 'pages/purchase-register.html', title: 'Purchase Ledger Register' },
        '#/masters': { path: 'pages/masters.html', title: 'Masters Configuration' },
        '#/settings': { path: 'pages/settings.html', title: 'Global Configurations' }
    },

    initialize() {
        // Monitor hash transitions
        window.addEventListener('hashchange', () => this.evaluateRouteTransition());
        window.addEventListener('load', () => this.evaluateRouteTransition());
        
        // Default to dashboard on startup
        if (!window.location.hash || window.location.hash === '#/login') {
            window.location.hash = '#/dashboard';
        }
    },

    async evaluateRouteTransition() {
        const activeHash = window.location.hash || '#/dashboard';
        
        // Automatically redirect login hash requests to dashboard
        if (activeHash === '#/login') {
            window.location.hash = '#/dashboard';
            return;
        }

        // Handle parameters inside dynamic workspace queries (e.g. ?type=...)
        const cleanHash = activeHash.split('?')[0];
        const targetRoute = this.routes[cleanHash];
        const loader = document.getElementById('pageLoader');
        
        if (loader) loader.classList.add('active');

        // Unrecognized route fallback
        if (!targetRoute) {
            console.error(`Route "${cleanHash}" is not registered in the system map.`);
            window.location.hash = '#/dashboard';
            return;
        }

        // Fetch and load the target page fragment
        try {
            const viewport = document.getElementById('mainContentViewport');
            if (!viewport) return;

            // Extract the true path and append URL parameters to support dynamic workspaces
            const paramQueryString = activeHash.includes('?') ? activeHash.split('?')[1] : '';
            const fetchPath = paramQueryString ? `${targetRoute.path}&${paramQueryString}` : targetRoute.path;

            const response = await fetch(fetchPath);
            
            if (!response.ok) {
                throw new Error(`Failed to load page resource: ${response.statusText}`);
            }

            const htmlFragment = await response.text();
            viewport.innerHTML = htmlFragment;

            // Update page headers
            const headerBreadcrumb = document.getElementById('currentBreadcrumbHeader');
            if (headerBreadcrumb) headerBreadcrumb.innerText = targetRoute.title;

            // Highlight the active sidebar navigation link
            this.highlightSidebarLink(cleanHash);

            // Execute scripts inside the loaded page fragment
            this.executePageFragmentScripts(viewport);

            // Trigger dynamic load hooks
            this.triggerPageLifecycleHook(cleanHash, paramQueryString);

            // Hide loader
            if (loader) loader.classList.remove('active');

        } catch (err) {
            console.error("Failed to load routed layout container view:", err);
            if (loader) loader.classList.remove('active');
        }
    },

    highlightSidebarLink(cleanHash) {
        document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
            const linkHref = link.getAttribute('href').split('?')[0];
            if (linkHref === cleanHash) {
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
            
            setTimeout(() => {
                executableScript.remove();
            }, 100);
        });
    },

    /**
     * Trigger initialization hooks for dynamic layout files (e.g. loading workspace configurations)
     */
    triggerPageLifecycleHook(cleanHash, queryString) {
        if (cleanHash === '#/sales/upload' || cleanHash === '#/purchase/upload') {
            const urlParams = new URLSearchParams(queryString);
            const activeDocType = urlParams.get('type') || 'sales-invoice';
            
            if (window.SalesOCRWorkspace) {
                const workspace = new window.SalesOCRWorkspace('docCanvas', 'universalWorkspaceContainer');
                workspace.initialize(activeDocType);
            }
        }
    }
};

window.AppRouter = AppRouter;

document.addEventListener('DOMContentLoaded', () => {
    AppRouter.initialize();
});
