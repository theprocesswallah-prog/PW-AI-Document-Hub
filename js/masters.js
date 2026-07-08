/**
 * Processwallah OCR ERP - Masters Live Sheet CRUD Controller
 * Version 1.0.0
 * Pure functional execution linked via Apps Script REST web service.
 */

const MastersManager = {
    // Current Active Scope State
    activeSheet: 'CUSTOMER_MASTER',
    activeRowIndex: null, // Tracked using spreadsheet absolute rows (Row Index = index in allData array + 2)
    allData: [],

    // Database Schemas definitions exactly matching Phase 3 Google Sheets parameters
    schemas: {
        'CUSTOMER_MASTER': [
            { field: 'Customer_ID', label: 'Customer ID', type: 'text', required: true, readonly: true, default: 'CST-' },
            { field: 'Legal_Name', label: 'Legal Corporate Name', type: 'text', required: true },
            { field: 'Trade_Name', label: 'Trade Brand Name', type: 'text', required: false },
            { field: 'GSTIN', label: '15-char GSTIN Code', type: 'text', required: true, pattern: '\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}\\d[Z]{1}[A-Z\\d]{1}' },
            { field: 'Address', label: 'Billing Address', type: 'text', required: true },
            { field: 'Email', label: 'Primary Communications Email', type: 'email', required: true },
            { field: 'Phone', label: 'Phone Contact', type: 'text', required: true }
        ],
        'VENDOR_MASTER': [
            { field: 'Vendor_ID', label: 'Vendor ID', type: 'text', required: true, readonly: true, default: 'VND-' },
            { field: 'Legal_Name', label: 'Legal Corporate Name', type: 'text', required: true },
            { field: 'Trade_Name', label: 'Trade Brand Name', type: 'text', required: false },
            { field: 'GSTIN', label: '15-char GSTIN Code', type: 'text', required: true, pattern: '\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}\\d[Z]{1}[A-Z\\d]{1}' },
            { field: 'Address', label: 'Billing Address', type: 'text', required: true },
            { field: 'Email', label: 'Billing Communications Email', type: 'email', required: true },
            { field: 'Phone', label: 'Phone Contact', type: 'text', required: true },
            { field: 'Primary_GL_Account', label: 'Default Ledger Account (Primary Match Offset)', type: 'select', options: ['60040 - Carriage Inward', '60010 - IT infrastructure & cloud', '62000 - Professional Consultancies'], required: true }
        ],
        'PRODUCT_MASTER': [
            { field: 'Product_ID', label: 'Product Catalog ID', type: 'text', required: true, readonly: true, default: 'PRD-' },
            { field: 'Product_Name', label: 'Standard Catalog Title', type: 'text', required: true },
            { field: 'Product_SKU', label: 'Internal Finished Product SKU', type: 'text', required: true },
            { field: 'Default_HSN_Code', label: 'Statutory Product HSN Code', type: 'text', required: true },
            { field: 'Default_UOM_Code', label: 'Stock Valuation UOM Symbol', type: 'select', options: ['KG', 'PCS', 'MTR', 'TON', 'LTRS'], required: true },
            { field: 'Sales_Price', label: 'Standard Unit Rate (Price)', type: 'number', required: true }
        ],
        'ITEM_MASTER': [
            { field: 'Item_ID', label: 'Item ID', type: 'text', required: true, readonly: true, default: 'ITM-' },
            { field: 'Item_Name', label: 'Raw Inventory Material Name', type: 'text', required: true },
            { field: 'Item_SKU', label: 'Internal Stock SKU', type: 'text', required: true },
            { field: 'Default_HSN_Code', label: 'Tax HSN Code', type: 'text', required: true },
            { field: 'Default_UOM_Code', label: 'UOM Unit Code', type: 'select', options: ['KG', 'PCS', 'MTR', 'TON', 'LTRS'], required: true },
            { field: 'Purchase_Price', label: 'Procurement Unit Price', type: 'number', required: true },
            { field: 'Primary_GL_Account', label: 'Liability offset account', type: 'select', options: ['60010 - Raw Material Purchase', '61010 - Packing Surcharges'], required: true }
        ],
        'HSN_MASTER': [
            { field: 'HSN_Code', label: 'HSN/SAC Code', type: 'text', required: true },
            { field: 'HSN_Description', label: 'Official Description Translation', type: 'text', required: true },
            { field: 'Default_GST_Code', label: 'Linked GST Default', type: 'select', options: ['GST18', 'GST5', 'EXEMPT'], required: true }
        ],
        'GST_MASTER': [
            { field: 'GST_Code', label: 'GST Target Code', type: 'text', required: true },
            { field: 'GST_Rate', label: 'Overall Surcharge Ratio (e.g. 0.18)', type: 'number', required: true },
            { field: 'CGST_Rate', label: 'CGST Offset Fraction', type: 'number', required: true },
            { field: 'SGST_Rate', label: 'SGST Offset Fraction', type: 'number', required: true },
            { field: 'IGST_Rate', label: 'IGST Output Fraction', type: 'number', required: true },
            { field: 'Description', label: 'Slab Tax Description', type: 'text', required: true }
        ],
        'UOM_MASTER': [
            { field: 'UOM_Code', label: 'Unit Short Code Symbol (e.g. KG)', type: 'text', required: true },
            { field: 'UOM_Description', label: 'Extended Measurement Label', type: 'text', required: true }
        ]
    },

    initialize() {
        this.bindEvents();
        this.loadMasterData(this.activeSheet);
    },

    bindEvents() {
        // Tab routing switches
        document.querySelectorAll('.master-tab-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetBtn = e.currentTarget;
                document.querySelectorAll('.master-tab-btn').forEach(btn => btn.classList.remove('active'));
                targetBtn.classList.add('active');
                
                this.activeSheet = targetBtn.getAttribute('data-sheet');
                document.getElementById('activeMasterTitle').innerText = targetBtn.querySelector('span:last-child').innerText;
                
                this.loadMasterData(this.activeSheet);
            });
        });

        // Search trigger
        const searchInput = document.getElementById('masterSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterLocalRegistry(e.target.value));
        }

        // Add Record Modal trigger
        const createBtn = document.getElementById('btnCreateMaster');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openModal());
        }
    },

    /**
     * Connection Engine. Returns error alerts if settings configurations are missing
     */
    async loadMasterData(sheetName) {
        const globalScriptUrl = localStorage.getItem('google_script_url') || '';
        const tableBody = document.getElementById('masterTableBody');
        
        if (!globalScriptUrl) {
            this.allData = [];
            tableBody.innerHTML = `
                <tr>
                    <td colspan="100%" style="text-align:center; padding: 48px; color: var(--text-secondary);">
                        <span class="material-symbols-rounded" style="font-size: 48px; color: var(--text-light); margin-bottom: 12px; display:block;">cloud_off</span>
                        <h4 style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Active API Connection Offline</h4>
                        <p style="font-size: 12px; max-width: 400px; margin: 0 auto 16px auto;">Please configure your Google Apps Script Web App URL in the Settings panel to enable real-time database connections.</p>
                        <a href="settings.html" class="btn btn-secondary" style="padding: 8px 14px; font-size:12px;">Configure App Connector</a>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = `<tr><td colspan="100%" style="text-align:center; padding:40px;"><div class="page-loader-bar" style="transform:translateX(0); width:50%; margin:0 auto; background-color:var(--primary); height:2px;"></div><span style="font-size:12px; color:var(--text-secondary); margin-top:8px; display:block;">Querying ${sheetName}...</span></td></tr>`;

        try {
            const response = await fetch(`${globalConfigRouteHelper(globalScriptUrl(globalConfigKey))}?endpoint=read&sheet=${sheetName}`);
            const payload = await response.json();
            
            if (payload.status === 'success') {
                this.allData = payload.data;
                this.renderTable(this.allData, sheetName);
            } else {
                throw new Error(payload.message || 'Database error occurred');
            }
        } catch (err) {
            console.error("API database fetch operation failed:", err);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="100%" style="text-align:center; padding: 40px; color: #EF4444;">
                        <span class="material-symbols-rounded" style="font-size: 36px; margin-bottom: 8px; display:block;">report_problem</span>
                        <h4 style="font-weight:600; margin-bottom:4px;">Spreadsheet Syncer Handshake Interrupted</h4>
                        <p style="font-size:12px; color: var(--text-secondary);">${err.message}</p>
                    </td>
                </tr>
            `;
        }
    },

    renderTable(data, sheetName) {
        const headContainer = document.getElementById('masterTableHead');
        const bodyContainer = document.getElementById('masterTableBody');
        const activeFields = this.schemas[sheetName];

        // 1. Render dynamic column headers
        let headersHtml = '';
        activeFields.forEach(col => {
            headersHtml += `<th>${col.label}</th>`;
        });
        headersHtml += `<th style="text-align: right; width:120px;">Actions</th>`;
        headContainer.innerHTML = headersHtml;

        // 2. Render dynamic row values
        bodyContainer.innerHTML = '';
        if (data.length === 0) {
            bodyContainer.innerHTML = `<tr><td colspan="${activeFields.length + 1}" style="text-align:center; color: var(--text-light); padding: 40px;">No operational record found in this registry context.</td></tr>`;
            return;
        }

        data.forEach((row, index) => {
            let rowHtml = '';
            activeFields.forEach(col => {
                const cellVal = row[col.field] !== undefined ? row[col.field] : '';
                rowHtml += `<td style="font-weight: ${col.readonly ? '600' : 'normal'};">${cellVal}</td>`;
            });
            
            rowHtml += `
                <td style="text-align: right;">
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size:11px;" onclick="MastersManager.openModal(${index})">Edit</button>
                    <button class="btn btn-secondary" style="padding: 4px 8px; font-size:11px; color:#EF4444;" onclick="MastersManager.deleteRecord(${index})">Delete</button>
                </td>
            `;
            const tr = document.createElement('tr');
            tr.innerHTML = rowHtml;
            bodyContainer.appendChild(tr);
        });
    },

    filterLocalRegistry(query) {
        const cleanedQuery = query.toLowerCase();
        const filtered = this.allData.filter(row => {
            return Object.values(row).some(val => String(val).toLowerCase().includes(cleanedQuery));
        });
        this.renderTable(filtered, this.activeSheet);
    },

    openModal(index = null) {
        const modal = document.getElementById('masterModal');
        const container = document.getElementById('modalFieldsContainer');
        const fields = this.schemas[this.activeSheet];
        
        this.activeRowIndex = index;
        const isEdit = index !== null;
        
        document.getElementById('modalTitle').innerText = isEdit ? `Edit Record - ${fields[0].label}` : `Create New ${fields[0].label.split(' ')[0]} Record`;
        container.innerHTML = '';

        const targetRow = isEdit ? this.allData[index] : {};

        fields.forEach(field => {
            let value = targetRow[field.field] !== undefined ? targetRow[field.field] : '';
            
            // Handle numeric index tracking incrementations safely
            if (!isEdit && field.default) {
                const count = this.allData.length + 1;
                value = field.default + String(count).padStart(5, '0');
            }

            const isReadOnlyAttr = (field.readonly && isEdit) ? 'readonly style="background-color:#EEF2F6; cursor:not-allowed;"' : '';
            const requiredAttr = field.required ? 'required' : '';
            const patternAttr = field.pattern ? `pattern="${field.pattern}" title="Requires character standard matching pattern format: ${field.pattern}"` : '';

            let formGroupHtml = '';
            if (field.type === 'select') {
                let optionsHtml = '';
                field.options.forEach(opt => {
                    const selected = opt === value ? 'selected' : '';
                    optionsHtml += `<option value="${opt}" ${selected}>${opt}</option>`;
                });
                formGroupHtml = `
                    <div class="form-group">
                        <label class="form-label">${field.label} ${field.required ? '*' : ''}</label>
                        <select class="form-input" name="${field.field}" ${requiredAttr} style="background:none;">${optionsHtml}</select>
                    </div>
                `;
            } else {
                formGroupHtml = `
                    <div class="form-group">
                        <label class="form-label">${field.label} ${field.required ? '*' : ''}</label>
                        <input type="${field.type}" class="form-input" name="${field.field}" value="${value}" ${isReadOnlyAttr} ${requiredAttr} ${patternAttr}>
                    </div>
                `;
            }
            const div = document.createElement('div');
            div.innerHTML = formGroupHtml;
            container.appendChild(div);
        });

        modal.style.display = 'flex';
    },

    closeModal() {
        document.getElementById('masterModal').style.display = 'none';
        this.activeRowIndex = null;
    },

    async handleFormSubmit(event) {
        event.preventDefault();
        const globalScriptUrl = localStorage.getItem('google_script_url') || '';
        
        if (!globalScriptUrl) {
            Toast.show('No active API connector configured. Changes discarded.', 'error');
            this.closeModal();
            return;
        }

        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('active');

        const formData = new FormData(event.target);
        const record = {};
        formData.forEach((value, key) => {
            record[key] = value;
        });

        const isEdit = this.activeRowIndex !== null;

        try {
            const response = await fetch(globalScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: isEdit ? 'update' : 'create',
                    sheet: this.activeSheet,
                    rowIndex: isEdit ? this.activeRowIndex + 2 : null, // Rows start at 1, row 1 is the header. Row index = array index + 2.
                    data: record
                })
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                Toast.show('Google Sheet master record successfully synchronized', 'success');
                this.loadMasterData(this.activeSheet);
                this.closeModal();
            } else {
                throw new Error(result.message || 'Write transaction aborted');
            }
        } catch (err) {
            console.error("Master Sync Failure:", err);
            Toast.show(`Master Sync Failure: ${err.message}`, 'error');
        } finally {
            if (loader) loader.classList.remove('active');
        }
    },

    async deleteRecord(index) {
        if (!confirm('Are you sure you want to permanently delete this master record? This action cannot be undone.')) return;
        
        const globalScriptUrl = localStorage.getItem('google_script_url') || '';
        if (!globalScriptUrl) {
            Toast.show('API connection offline. Delete cancelled.', 'error');
            return;
        }

        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('active');

        try {
            const response = await fetch(globalScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'delete',
                    sheet: this.activeSheet,
                    rowIndex: index + 2 // Rows start at 1, row 1 is the header. Row index = array index + 2.
                })
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                Toast.show('Record purged from Google Sheets Master Catalog', 'success');
                this.loadMasterData(this.activeSheet);
            } else {
                throw new Error(result.message || 'Delete operation aborted');
            }
        } catch (err) {
            console.error("Delete failed:", err);
            Toast.show(`Delete Failed: ${err.message}`, 'error');
        } finally {
            if (loader) loader.classList.remove('active');
        }
    }
};

// Utilities configuration routing checks
function globalScriptUrl(key) { return localStorage.getItem(key) || ''; }
function globalConfigKey() { return 'google_script_url'; }
function globalConfigRouteHelper(url) { return url; }

document.addEventListener('DOMContentLoaded', () => {
    MastersManager.initialize();
    window.MastersManager = MastersManager;
});
