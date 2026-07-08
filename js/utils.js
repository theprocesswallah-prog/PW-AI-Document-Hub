/**
 * Processwallah OCR ERP - Global Shared Utilities
 * Version 1.0.0
 */

/**
 * Retrieves the currently saved and validated Apps Script REST Endpoint
 * @returns {string} The active Apps Script Web App URL or an empty string
 */
function getApiBaseUrl() {
    return localStorage.getItem('PROCESSWALLAH_API_URL') || '';
}

/**
 * System-Wide Format Helpers
 */
const ERPUtils = {
    formatCurrency(value, currencySymbol = '₹') {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return currencySymbol + ' ' + num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
};

// Bind to global browser scope
window.getApiBaseUrl = getApiBaseUrl;
window.ERPUtils = ERPUtils;

// Compatibility polyfill for previous sprint configs
window.globalScriptUrl = function() {
    return getApiBaseUrl();
};
window.globalConfigRouteHelper = function(url) {
    return url;
};
