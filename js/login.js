/**
 * Processwallah OCR Engine V1.0 - Core Login Operations Coordinator
 * Version 1.0.0
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('fieldUsername').value.trim();
            const passwordInput = document.getElementById('fieldPassword').value;

            const loader = document.getElementById('pageLoader');
            if (loader) loader.classList.add('active');

            try {
                const session = await AuthService.login(usernameInput, passwordInput);
                if (session) {
                    NotificationService.showSuccess("System session initialized successfully.");
                    // Standard redirection logic
                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 800);
                }
            } catch (err) {
                NotificationService.showError(`Authentication Blocked: ${err.message}`);
            } finally {
                if (loader) loader.classList.remove('active');
            }
        });
    }
});
