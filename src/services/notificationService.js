/**
 * Processwallah OCR Engine V1.0 - Core Notification & Toast UI Service
 * Version 1.0.0
 */
const NotificationService = {
    showSuccess(message) {
        if (window.Toast) window.Toast.show(message, 'success');
        else console.log('%cSuccess: ' + message, 'color: green; font-weight: bold;');
    },
    showError(message) {
        if (window.Toast) window.Toast.show(message, 'error');
        else console.error('Error: ' + message);
    },
    showWarning(message) {
        if (window.Toast) window.Toast.show(message, 'warning');
        else console.warn('Warning: ' + message);
    },
    showInfo(message) {
        if (window.Toast) window.Toast.show(message, 'info');
        else console.log('Info: ' + message);
    }
};
window.NotificationService = NotificationService;
