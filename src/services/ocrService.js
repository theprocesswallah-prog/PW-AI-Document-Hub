/**
 * Processwallah OCR Engine V1.0 - Placeholder OCR Pipeline Service
 * Version 1.0.0
 */
const OCRService = {
    async executeMockOCRAnalysis(fileBlob, documentType) {
        console.log("Mock OCR execution initiated for fileType: " + documentType);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    status: 'success',
                    confidence: 0.9420,
                    extracted_fields: {
                        invoice_number: "INV-2025-0814",
                        invoice_date: "2025-01-24",
                        gst_number: "27AAAAA1111A1Z1"
                    }
                });
            }, 1500);
        });
    }
};
window.OCRService = OCRService;
