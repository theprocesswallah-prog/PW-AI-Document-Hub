/**
 * Processwallah OCR Engine V1.0 - Placeholder Registry Datatables CSV/Excel Export Service
 * Version 1.0.0
 */
const ExportService = {
    exportToCsv(dataset, filename = 'registry_export.csv') {
        if (!dataset || dataset.length === 0) return;
        const keys = Object.keys(dataset[0]);
        let csvContent = "data:text/csv;charset=utf-8," + keys.join(",") + "\n";
        dataset.forEach(row => {
            const values = keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`);
            csvContent += values.join(",") + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
window.ExportService = ExportService;
