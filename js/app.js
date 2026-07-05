/**
 * Core Application Shell and Layout Handlers
 */
document.addEventListener('DOMContentLoaded', () => {
    // Page Loader animation on load
    const loader = document.createElement('div');
    loader.className = 'page-loader active';
    const bar = document.createElement('div');
    bar.className = 'page-loader-bar';
    loader.appendChild(bar);
    document.body.appendChild(loader);

    setTimeout(() => {
        loader.classList.remove('active');
        setTimeout(() => loader.remove(), 300);
    }, 400);

    // Sidebar Collapse Logic
    const sidebar = document.getElementById('appSidebar');
    const menuToggle = document.getElementById('menuToggle');

    // Retrieve state from localStorage to maintain user preference across page navigation
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            if (window.innerWidth > 1024) {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
            } else {
                sidebar.classList.toggle('open');
            }
        });
    }

    // Dynamic Search Filter Logic for Tables
    const searchInput = document.getElementById('tableSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.enterprise-table tbody tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }
});
