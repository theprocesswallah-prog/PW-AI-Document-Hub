/**
 * Application Core Bootstrapper
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize UI Controls
    window.AppUI.init();

    // 2. Register Routes and Map Views
    window.AppRouter.register('#/dashboard', () => {
        window.AppUI.updateNavigationHighlight('#/dashboard');
        window.AppUI.setBreadcrumb('Workspace', 'Dashboard');
        window.AppUI.renderPageShellPlaceholder('Dashboard Workspace');
    });

    window.AppRouter.register('#/sales-upload', () => {
        window.AppUI.updateNavigationHighlight('#/sales-upload');
        window.AppUI.setBreadcrumb('Sales Department', 'AI Document Upload');
        window.AppUI.renderPageShellPlaceholder('Sales Document Upload Pane');
    });

    window.AppRouter.register('#/sales-register', () => {
        window.AppUI.updateNavigationHighlight('#/sales-register');
        window.AppUI.setBreadcrumb('Sales Department', 'Sales Register');
        window.AppUI.renderPageShellPlaceholder('Sales Extract Register');
    });

    window.AppRouter.register('#/purchase-upload', () => {
        window.AppUI.updateNavigationHighlight('#/purchase-upload');
        window.AppUI.setBreadcrumb('Purchase Department', 'AI Bill Upload');
        window.AppUI.renderPageShellPlaceholder('Purchase Bill Upload Pane');
    });

    window.AppRouter.register('#/purchase-register', () => {
        window.AppUI.updateNavigationHighlight('#/purchase-register');
        window.AppUI.setBreadcrumb('Purchase Department', 'Purchase Register');
        window.AppUI.renderPageShellPlaceholder('Purchase Extract Register');
    });

    window.AppRouter.register('#/masters', () => {
        window.AppUI.updateNavigationHighlight('#/masters');
        window.AppUI.setBreadcrumb('System', 'Masters Configuration');
        window.AppUI.renderPageShellPlaceholder('Tax & Ledger Account Masters');
    });

    window.AppRouter.register('#/settings', () => {
        window.AppUI.updateNavigationHighlight('#/settings');
        window.AppUI.setBreadcrumb('System', 'Global Settings');
        window.AppUI.renderPageShellPlaceholder('Integrations & Engine Settings');
    });

    // 3. Trigger Initial Boot
    window.AppRouter.handleRouting();
});
