/**
 * Shared UI Controller
 */
const UI = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const menuBtn = document.getElementById('menuToggle');
        const sidebar = document.getElementById('appSidebar');

        if (menuBtn && sidebar) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('open');
            });

            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            });
        }
    },

    updateNavigationHighlight(activeHash) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === activeHash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    setBreadcrumb(parent, current) {
        const titleEl = document.getElementById('currentBreadcrumb');
        if (titleEl) {
            titleEl.textContent = current;
        }
    },

    renderPageShellPlaceholder(viewName) {
        const viewport = document.getElementById('contentViewport');
        if (!viewport) return;

        // Structured Layout Placeholder for initial shell phase
        viewport.innerHTML = `
            <div class="view-placeholder" style="display: flex; flex-direction: column; gap: 16px; animation: fadeIn 0.3s ease-in-out;">
                <div style="background-color: var(--card); border: 1px solid var(--border-color); border-radius: var(--border-radius); padding: 24px;">
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${viewName}</h2>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                        This module layout is active within the container workspace. The functional HTML, logic, and operational variables will be populated in subsequent development phases.
                    </p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
                    <div style="background-color: var(--card); height: 120px; border: 1px solid var(--border-color); border-radius: var(--border-radius); border-left: 4px solid var(--primary);"></div>
                    <div style="background-color: var(--card); height: 120px; border: 1px solid var(--border-color); border-radius: var(--border-radius); border-left: 4px solid var(--accent);"></div>
                    <div style="background-color: var(--card); height: 120px; border: 1px solid var(--border-color); border-radius: var(--border-radius); border-left: 4px solid var(--text-light);"></div>
                </div>
            </div>
        `;
    }
};

window.AppUI = UI;
