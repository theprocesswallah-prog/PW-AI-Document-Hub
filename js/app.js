/**
 * Processwallah OCR - Core Client Application Controller
 * Version 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Page Loader Handler
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.add('active');
        window.addEventListener('load', () => {
            loader.classList.remove('active');
        });
        // Failsafe backup to disable loader if window load event already fired
        setTimeout(() => {
            loader.classList.remove('active');
        }, 500);
    }

    // 2. Sidebar Navigation State & Dynamic Path Highlighting
    const sidebar = document.getElementById('appSidebar');
    const menuToggle = document.getElementById('menuToggle');
    const currentPath = window.location.pathname;

    // Persist sidebar collapsed state across physical HTML page reloads
    const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    if (isCollapsed && sidebar && window.innerWidth > 1024) {
        sidebar.classList.add('collapsed');
    }

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

    // Close mobile slide-over sidebar when clicking outside the panel
    document.addEventListener('click', (e) => {
        if (sidebar && window.innerWidth <= 1024 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Automatically assign active link styles based on matching pathname
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            // Normalizing directory prefixes to ensure relative alignment matches
            const normalizedHref = href.replace('../', '');
            const normalizedPath = currentPath.substring(currentPath.lastIndexOf('/') + 1);

            if (normalizedPath === normalizedHref || (normalizedPath === '' && normalizedHref === 'index.html')) {
                navLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');
            }
        }
    });

    // 3. Dynamic Search Filter Logic for Table Components
    const tableSearchInput = document.getElementById('tableSearch');
    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.enterprise-table tbody tr');
            rows.forEach(row => {
                const text = row.innerText.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }
});

/**
 * Global Enterprise Components Controllers
 */

// Global Toast System Manager
const Toast = {
    show(message, type = 'success', duration = 4000) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.position = 'fixed';
            container.style.bottom = '24px';
            container.style.right = '24px';
            container.style.zIndex = '2000';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-element toast-${type}`;
        
        let icon = 'info';
        if (type === 'success') icon = 'check_circle';
        if (type === 'error') icon = 'error';
        if (type === 'warning') icon = 'warning';

        toast.innerHTML = `
            <span class="material-symbols-rounded toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        // Smooth entry animation styles appended dynamically
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '12px';
        toast.style.backgroundColor = '#FFFFFF';
        toast.style.color = 'var(--text-primary)';
        toast.style.padding = '12px 16px';
        toast.style.borderRadius = 'var(--border-radius)';
        toast.style.boxShadow = 'var(--shadow-md)';
        toast.style.borderLeft = '4px solid';
        toast.style.fontSize = '13px';
        toast.style.fontWeight = '500';
        toast.style.minWidth = '300px';
        toast.style.maxWidth = '450px';

        // Apply border color base on type
        if (type === 'success') toast.style.borderLeftColor = '#10B981';
        if (type === 'error') toast.style.borderLeftColor = '#EF4444';
        if (type === 'warning') toast.style.borderLeftColor = '#F59E0B';
        if (type === 'info') toast.style.borderLeftColor = 'var(--primary)';

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Global Modal Controller
const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
        }
    },
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    }
};

window.Toast = Toast;
window.Modal = Modal;
