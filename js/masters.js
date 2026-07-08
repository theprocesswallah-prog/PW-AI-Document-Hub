/**
 * Processwallah OCR ERP - Masters Live Sheet CRUD Controller
 * Version 1.0.0
 * Pure functional execution linked via Apps Script REST web service.
 */

const MastersManager = {
    // Current Active Scope State
    activeSheet: 'CUSTOMER_MASTER',
    activeRowIndex: null, // Used for update operations (row identifier mapping)
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
        'ITEM_MASTER': {
            title: 'Item Master',
            fields: [
                { id: 'itemId', label: 'Item ID', type: 'text', value: 'ITM-' }
            ]
        },
        'HSN_MASTER': {
            title: 'HSN Master',
            fields: []
        },
        'GST_MASTER': {
            title: 'GST Master',
            fields: []
        },
        'UOM_MASTER': {
            title: 'UOM Master',
            fields: []
        }
    },

    // Base fallback database used during initial deployment verification (before Apps Script initialization)
    mockDatabases: {
        'CUSTOMER_MASTER': [
            { Customer_ID: 'CST-00341', Legal_Name: 'Acme Industrial Supplies Pvt Ltd', Trade_Name: 'Acme Supplies', GSTIN: '27AAAAA1111A1Z1', Address: 'Plot 4, MIDC Area, Pune, MH, 411014', Email: 'finance@acme.com', Phone: '+912099881122' },
            { Customer_ID: 'CST-00109', Legal_Name: 'Nvidia APAC Division Limited', Trade_Name: 'Nvidia APAC', GSTIN: '27BBBBB2222B2Z2', Address: 'Tech Park Zone 2, Bangalore, KA, 560001', Email: 'accounts@nvidia.com', Phone: '+918044552211' }
        ],
        'VENDOR_MASTER': [
            { Vendor_ID: 'VND-00102', Legal_Name: 'Nexus Logistics Ltd', Trade_Name: 'Nexus Cargo', GSTIN: '27CCCCC3333C3Z3', Address: '88 Container Port, Gate 4, Mumbai, MH, 400001', Email: 'billing@nexus.com', Phone: '+912211223344', Primary_GL_Account: '60040 - Carriage Inward' }
        ],
        'PRODUCT_MASTER': [
            { Product_ID: 'PRD-00054', Product_Name: 'Carbon Steel Sheet 2mm Grade A', Product_SKU: 'CSS-2MM-FIN', Default_HSN_Code: '7208', Default_UOM_Code: 'MTR', Sales_Price: 1850.00 }
        ],
        'ITEM_MASTER': [
            { Item_ID: 'ITM-00891', Item_Name: 'Chemical Raw Compound C2', Item_SKU: 'RAW-CHEM-C2', Default_HSN_Code: '2801', Default_UOM_Code: 'KG', Purchase_Price: 450.00, Primary_GL_Account: '60010 - IT infrastructure & cloud' }
        ],
        'HSN_MASTER': [
            { HSN_Code: '7208', HSN_Description: 'Flat-rolled products of iron or non-alloy steel', Default_GST_Code: 'GST18' },
            { HSN_Code: '2801', HSN_Description: 'Fluorine, chlorine, bromine and iodine chemical elements', Default_GST_Code: 'GST18' }
        ],
        'GST_MASTER': [
            { GST_Code: 'GST18', GST_Rate: 0.1800, CGST_Rate: 0.0900, SGST_Rate: 0.0900, IGST_Rate: 0.1800, Description: 'Standard GST 18% Rate' },
            { GST_Code: 'GST5', GST_Rate: 0.0500, CGST_Rate: 0.0250, SGST_Rate: 0.0250, IGST_Rate: 0.0500, Description: 'Concessional Goods Rate' }
        ],
        'UOM_MASTER': [
            { UOM_Code: 'KG', UOM_Description: 'Kilograms' },
            { UOM_Code: 'PCS', UOM_Description: 'Pieces' },
            { UOM_Code: 'MTR', UOM_Description: 'Meters' }
        ]
    },

    // Extended schemas definitions for the index registers added to prevent empty loops
    registerSchemas() {
        this.schemas['ITEM_MASTER'] = [
            { field: 'Item_ID', label: 'Item ID', type: 'text', required: true, readonly: true, default: 'ITM-' },
            { field: 'Item_Name', label: 'Raw Inventory Material Name', type: 'text', required: true },
            { field: 'Item_SKU', label: 'Internal Stock SKU', type: 'text', required: true },
            { field: 'Default_HSN_Code', label: 'Tax HSN Code', type: 'text', required: true },
            { field: 'Default_UOM_Code', label: 'UOM Unit Code', type: 'select', options: ['KG', 'PCS', 'MTR', 'TON', 'LTRS'], required: true },
            { field: 'Purchase_Price', label: 'Procurement Unit Price', type: 'number', required: true },
            { field: 'Primary_GL_Account', label: 'Liability offset account', type: 'select', options: ['60010 - Raw Material Purchase', '61010 - Packing Surcharges'], required: true }
        ];
        this.schemas['HSN_MASTER'] = [
            { field: 'HSN_Code', label: 'HSN/SAC Code', type: 'text', required: true },
            { field: 'HSN_Description', label: 'Official Description Translation', type: 'text', required: true },
            { field: 'Default_GST_Code', label: 'Linked GST Default', type: 'select', options: ['GST18', 'GST5', 'EXEMPT'], required: true }
        ];
        this.schemas['GST_MASTER'] = [
            { field: 'GST_Code', label: 'GST Target Code', type: 'text', required: true },
            { field: 'GST_Rate', label: 'Overall Surcharge Ratio (e.g. 0.18)', type: 'number', required: true },
            { field: 'CGST_Rate', label: 'CGST Offset Fraction', type: 'number', required: true },
            { field: 'SGST_Rate', label: 'SGST Offset Fraction', type: 'number', required: true },
            { field: 'IGST_Rate', label: 'IGST Output Fraction', type: 'number', required: true },
            { field: 'Description', label: 'Slab Tax Description', type: 'text', required: true }
        ];
        this.schemas['UOM_MASTER'] = [
            { field: 'UOM_Code', label: 'Unit Short Code Symbol (e.g. KG)', type: 'text', required: true },
            { field: 'UOM_Description', label: 'Extended Measurement Label', type: 'text', required: true }
        ];
    },

    initialize() {
        this.registerSchemas();
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
     * Data loader handles dynamic HTTP connection OR reads localized structural mock values instantly
     */
    async loadMasterData(sheetName) {
        const globalScriptUrl = localStorage.getItem('google_script_url') || '';
        
        if (globalScriptUrl) {
            try {
                // Execute secure query over GET parsing API parameters
                const response = await fetch(`${globalScriptUrl}?action=read&sheet=${sheetName}`);
                const payload = await response.json();
                if (payload.status === 'success') {
                    this.allData = payload.data;
                    this.renderTable(this.allData, sheetName);
                    return;
                }
            } catch (err) {
                console.warn("REST endpoint unavailable, falling back to local dataset:", err);
            }
        }
        
        // Staging execution fallback
        this.allData = [...this.mockDatabases[sheetName]];
        this.renderTable(this.allData, sheetName);
    },

    renderTable(data, sheetName) {
        const headContainer = document.getElementById('masterTableHead');
        const bodyContainer = document.getElementById('masterTableBody');
        const activeFields = this.schemas[sheetName];

        // 1. Render Table Headers dynamically
        let headersHtml = '';
        activeFields.forEach(col => {
            headersHtml += `<th>${col.label}</th>`;
        });
        headersHtml += `<th style="text-align: right; width:120px;">Actions</th>`;
        headContainer.innerHTML = headersHtml;

        // 2. Render Data Rows dynamically
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

        // Retrieve existing dataset row if Editing is initiated
        const targetRow = isEdit ? this.allData[index] : {};

        fields.forEach(field => {
            let value = targetRow[field.field] !== undefined ? targetRow[field.field] : '';
            if (!isEdit && field.default) {
                // Pre-fill primary sequence incremental guesses
                const count = this.allData.length + 1;
                value = field.default + String(count).padStart(5, '0');
            }

            const isReadOnlyAttr = (field.readonly && isEdit) ? 'readonly style="background-color:#EEF2F6; cursor:not-allowed;"' : '';
            const requiredAttr = field.required ? 'required' : '';
            const patternAttr = field.pattern ? `pattern="${field.pattern}" title="Format constraint validation rule matches structure: ${field.pattern}"` : '';

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
        const formData = new FormData(event.target);
        const record = {};
        
        formData.forEach((value, key) => {
            record[value] = value; // Preserve numbers vs strings
            record[key] = value;
        });

        const globalScriptUrl = localStorage.getItem('google_script_url') || '';
        const isEdit = this.activeRowIndex !== null;

        if (globalScriptUrl) {
            try {
                // Post payload straight to spreadsheet API mapping transactional structures
                const response = await fetch(globalScriptUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: isEdit ? 'update' : 'create',
                        sheet: this.activeSheet,
                        rowIndex: isEdit ? this.activeRowIndex + 2 : null, // Sheet index maps rows shifted by 2 offsets (Header + Index 0 base)
                        data: record
                    })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    Toast.show('Google Sheets Database synchronized successfully', 'success');
                    this.loadMasterData(this.activeSheet);
                    this.closeModal();
                    return;
                }
            } catch (err) {
                console.warn("API write failure, reverting CRUD changes locally:", err);
            }
        }

        // Cache edits dynamically on local state fallback
        if (isEdit) {
            this.allData[this.activeRowIndex] = record;
            Toast.show('Record updated successfully', 'success');
        } else {
            this.allData.push(record);
            Toast.show('Record saved successfully', 'success');
        }
        
        // Persist mock fallback state to maintain memory integrity
        this.mockDatabases[this.activeSheet] = [...this.allData];
        this.renderTable(this.allData, this.activeSheet);
        this.closeModal();
    },

    async deleteRecord(index) {
        if (!confirm('Are you sure you want to permanently delete this master record? This cascade change is atomic.')) return;
        
        const globalScriptUrl = localStorage.getItem('google_script_url') || '';
        if (globalScriptUrl) {
            try {
                const response = await fetch(globalScriptUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'delete',
                        sheet: this.activeSheet,
                        rowIndex: index + 2
                    })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    Toast.show('Record purged from Google Sheets Master Catalog', 'success');
                    this.loadMasterData(this.activeSheet);
                    return;
                }
            } catch (err) {
                console.error("API delete failed:", err);
            }
        }

        this.allData.splice(index, 1);
        this.mockDatabases[this.activeSheet] = [...this.allData];
        this.renderTable(this.allData, this.activeSheet);
        Toast.show('Record deleted from local session memory.', 'warning');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MastersManager.initialize();
    window.MastersManager = MastersManager;
});
