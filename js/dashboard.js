/**
 * Processwallah OCR Engine V1.0 - Dashboard UI Coordinator
 * Version 1.0.0
 * Connects directly to the Dashboard Service.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const loader = document.getElementById('pageLoader');
    if (loader) loader.classList.add('active');

    try {
        const metrics = await DashboardService.fetchKpiMetrics();
        
        // Update metric DOM values
        const totalUploadedEl = document.querySelector('.metric-card:nth-child(1) .metric-value');
        if (totalUploadedEl) totalUploadedEl.innerText = metrics.totalUploaded;

        const accuracyIndexEl = document.querySelector('.metric-card:nth-child(2) .metric-value');
        if (accuracyIndexEl) accuracyIndexEl.innerText = metrics.accuracyIndex;

        const pendingReviewEl = document.querySelector('.metric-card:nth-child(3) .metric-value');
        if (pendingReviewEl) pendingReviewEl.innerText = metrics.pendingReview;

        // Render dynamic table rows
        const queue = await DashboardService.getPipelineQueue();
        const tableBody = document.querySelector('.enterprise-table tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
            if (queue.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-secondary);">No dynamic documents parsed yet.</td></tr>`;
            } else {
                queue.forEach(doc => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-weight:600;">${doc.file_name}</td>
                        <td>${doc.document_type}</td>
                        <td>${new Date(doc.uploaded_at).toLocaleDateString()}</td>
                        <td>${(doc.ai_confidence_score * 100).toFixed(1)}%</td>
                        <td>${doc.file_size_bytes} Bytes</td>
                        <td><span class="badge ${doc.extraction_status === 'saved' ? 'synced' : 'pending'}">${doc.extraction_status}</span></td>
                        <td><a href="pages/universal-workspace.html?type=${doc.document_type.toLowerCase()}-invoice" class="btn btn-primary" style="padding:4px 8px; font-size:11px;">Review</a></td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
        }
    } catch (err) {
        console.error("Dashboard render failed:", err);
    } finally {
        if (loader) loader.classList.remove('active');
    }
});
