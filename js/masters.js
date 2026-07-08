/**
 * Processwallah OCR Engine V1.0 - Re-architected Cloud Masters Interface Coordinator
 * Version 1.1.0
 * Bypasses Apps Script legacy variables, calling live Supabase Master services.
 */
const MastersManager = {
    activeSheet: 'CUSTOMER_MASTER',
    allData: [],

    schemas: {
        'CUSTOMER_MASTER': [
            { field: 'customer_code', label: 'Customer Code', type: 'text', required: true, default: 'CST-' },
            { field: 'customer_name', label: 'Customer Legal Name', type: 'text', required: true },
            { field: 'trade_name', label: 'Trade Brand Name', type: 'text' },
            { field: 'gst_number', label: '15-char GSTIN', type: 'text', required: true, pattern: '\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}\\d[Z]{1}[A-Z\\d]{1}' },
            { field: 'country', label: 'Country', type: 'text', required: true, default: 'India' },
            { field: 'state', label: 'State', type: 'text', required: true },
            { field: 'city', label: 'City', type: 'text', required: true },
            { field: 'address', label: 'Registered Address', type: 'text', required: true },
            { field: 'pan', label: 'PAN Number', type: 'text', required: true, pattern: '^[A-Z]{5}\\d{4}[A-Z]{1}$' },
            { field: 'email', label: 'Email Correspondence', type: 'email' },
            { field: 'phone', label: 'Phone Line Contact', type: 'text' }
        ],
        'VENDOR_MASTER': [
            { field: 'vendor_code', label: 'Vendor Code', type: 'text', required: true, default: 'VND-' },
            { field: 'vendor_name', label: 'Vendor Legal Name', type: 'text', required: true },
            { field: 'gst_number', label: '15-char GSTIN', type: 'text', required: true, pattern: '\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}\\d[Z]{1}[A-Z\\d]{1}' },
            { field: 'country', label: 'Country', type: 'text', required: true, default: 'India' },
            { field: 'state', label: 'State', type: 'text', required: true },
            { field: 'city', label: 'City', type: 'text', required: true },
            { field: 'address', label: 'Registered Address', type: 'text', required: true },
            { field: 'pan', label: 'PAN Number', type: 'text', required: true, pattern: '^[A-Z]{5}\\d{4}[A-Z]{1}$' },
            { field: 'email', label: 'Email Correspondence', type: 'email' },
            { field: 'phone', label: 'Phone Line Contact', type: 'text' }
        ],
        'PRODUCT_MASTER': [
            { field: 'product_unique_id', label: 'Product Unique ID', type: 'text', required: true, default: 'PRD-' },
            { field: 'voltage_rating', label: 'Voltage Rating', type: 'text', required: true },
            { field: 'product_type', label: 'Product Type', type: 'text', required: true },
            { field: 'category', label: 'Category Classification', type: 'text', required: true },
            { field: 'phase', label: 'Phase (Single/Three)', type: 'select', options: ['Single Phase', 'Three Phase'], required: true },
            { field: 'ratio', label: 'Transformation Ratio', type: 'text', required: true },
            { field: 'accuracy', label: 'Metering Accuracy Class', type: 'text', required: true },
            { field: 'burden', label: 'Burden capacity (VA)', type: 'text', required: true },
            { field: 'product_variant', label: 'Product Variant Spec', type: 'text' }
        ],
        'ITEM_MASTER': [
            { field: 'item_code', label: 'Item Code', type: 'text', required: true, default: 'ITM-' },
            { field: 'item_name', label: 'Raw Inventory Material Name', type: 'text', required: true },
            { field: 'cuom', label: 'Consumption UOM', type: 'text', required: true },
            { field: 'puom', label: 'Purchase UOM', type: 'text', required: true },
            { field: 'unit_conversion', label: 'Unit Conversion Factor', type: 'number', required: true, default: 1.00 },
            { field: 'purchase_rate', label: 'Purchase Rate Unit Price', type: 'number', required: true },
            { field: 'item_group', label: 'Inventory Segment Group', type: 'text', required: true }
        ]
    },

    initialize() {
        this.bindEvents();
        this.loadMasterData();
    },

    bindEvents() {
        document.querySelectorAll('.master-tab-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.master-tab-btn').forEach(btn => btn.classList.remove('active'));
                const btn = e.currentTarget;
                btn.classList.add('active');
                this.activeSheet = btn.getAttribute('data-sheet');
                document.getElementById('activeMasterTitle').innerText = btn.querySelector('span:last-child').innerText;
                this.loadMasterData();
            });
        });
        document.getElementById('masterSearch').addEventListener('input', (e) => this.filterData(e.target.value));
        document.getElementById('btnCreateMaster').addEventListener('click', () => this.openEditorModal());
        document.getElementById('masterRecordForm').addEventListener('submit', (e) => this.handleSave(e));
    },

    async loadMasterData() {
        const body = document.getElementById('masterTableBody');
        body.innerHTML = `<tr><td colspan="100%" style="text-align:center; padding: 40px;"><div class="page-loader-bar" style="transform:translateX(0); width:50%; margin:0 auto; background-color:var(--primary); height:2px;"></div><span style="font-size:12px; color:var(--text-secondary); margin-top:8px; display:block;">Querying ${this.activeSheet}...</span></td></tr>`;
        
        try {
            let data = [];
            if (this.activeSheet === 'CUSTOMER_MASTER') data = await CustomerService.getAll();
            else if (this.activeSheet === 'VENDOR_MASTER') data = await VendorService.getAll();
            else if (this.activeSheet === 'PRODUCT_MASTER') data = await ProductService.getAll();
            else if (this.activeSheet === 'ITEM_MASTER') data = await ItemService.getAll();

            this.allData = data;
            this.renderTable(data);
        } catch (err) {
            NotificationService.showError(`Sync Interrupted: ${err.message}`);
        }
    },

    renderTable(data) {
        const head = document.getElementById('masterTableHead');
        const body = document.getElementById('masterTableBody');
        const schema = this.schemas[this.activeSheet];

        let headHtml = '';
        schema.forEach(field => { headHtml += `<th>${field.label}</th>`; });
        headHtml += `<th style="text-align:right;">Actions</th>`;
        head.innerHTML = headHtml;

        body.innerHTML = '';
        if (data.length === 0) {
            body.innerHTML = `<tr><td colspan="100%" style="text-align:center; padding: 48px; color: var(--text-secondary);"><span class="material-symbols-rounded" style="font-size: 36px; display:block; margin-bottom:8px;">dataset</span>No operational records found.</td></tr>`;
            return;
        }

        data.forEach((row, i) => {
            let rowHtml = '';
            schema.forEach(field => {
                rowHtml += `<td>${row[field.field] || ''}</td>`;
            });
            const pKey = this.getPrimaryKeyField();
            rowHtml += `<td style="text-align:right;">
                <button class="btn btn-secondary" style="padding: 4px 8px; font-size:11px;" onclick="MastersManager.openEditorModal(${i})">Edit</button>
                <button class="btn btn-secondary" style="padding: 4px 8px; font-size:11px; color:#EF4444;" onclick="MastersManager.handleDelete('${row[pKey]}')">Delete</button>
            </td>`;
            const tr = document.createElement('tr');
            tr.innerHTML = rowHtml;
            body.appendChild(tr);
        });
    },

    filterData(query) {
        const clean = query.toLowerCase();
        const filtered = this.allData.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(clean)));
        this.renderTable(filtered);
    },

    getPrimaryKeyField() {
        if (this.activeSheet === 'CUSTOMER_MASTER') return 'customer_id';
        if (this.activeSheet === 'VENDOR_MASTER') return 'vendor_id';
        if (this.activeSheet === 'PRODUCT_MASTER') return 'product_id';
        if (this.activeSheet === 'ITEM_MASTER') return 'item_id';
    },

    openEditorModal(index = null) {
        const modal = document.getElementById('masterModal');
        const container = document.getElementById('modalFieldsContainer');
        const schema = this.schemas[this.activeSheet];
        
        container.innerHTML = '';
        this.activeRowIndex = index;
        const row = index !== null ? this.allData[index] : {};

        document.getElementById('modalTitle').innerText = index !== null ? 'Modify Master Record' : 'Create Master Record';

        schema.forEach(field => {
            let value = row[field.field] || '';
            if (index === null && field.default) {
                value = field.default + String(this.allData.length + 1).padStart(5, '0');
            }
            const isReadOnly = (index !== null && field.field === this.getPrimaryKeyField()) ? 'readonly style="background:#E2E8F0;"' : '';
            
            let fieldHtml = '';
            if (field.type === 'select') {
                let optionsHtml = '';
                field.options.forEach(opt => {
                    optionsHtml += `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`;
                });
                fieldHtml = `<div class="form-group"><label class="form-label">${field.label}</label><select class="form-input" name="${field.field}" style="background:none;">${optionsHtml}</select></div>`;
            } else {
                fieldHtml = `<div class="form-group"><label class="form-label">${field.label}</label><input type="${field.type || 'text'}" class="form-input" name="${field.field}" value="${value}" ${isReadOnly} ${field.required ? 'required' : ''}></div>`;
            }
            const div = document.createElement('div');
            div.innerHTML = fieldHtml;
            container.appendChild(div);
        });

        modal.style.display = 'flex';
    },

    closeModal() {
        document.getElementById('masterModal').style.display = 'none';
        this.activeRowIndex = null;
    },

    async handleSave(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const record = {};
        formData.forEach((val, k) => { record[k] = val; });

        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('active');

        try {
            if (this.activeRowIndex !== null) {
                const pKey = this.getPrimaryKeyField();
                const recordId = this.allData[this.activeRowIndex][pKey];
                
                if (this.activeSheet === 'CUSTOMER_MASTER') await CustomerService.update(recordId, record);
                else if (this.activeSheet === 'VENDOR_MASTER') await VendorService.update(recordId, record);
                else if (this.activeSheet === 'PRODUCT_MASTER') await ProductService.update(recordId, record);
                else if (this.activeSheet === 'ITEM_MASTER') await ItemService.update(recordId, record);
                
                NotificationService.showSuccess('Record details updated');
            } else {
                if (this.activeSheet === 'CUSTOMER_MASTER') await CustomerService.create(record);
                else if (this.activeSheet === 'VENDOR_MASTER') await VendorService.create(record);
                else if (this.activeSheet === 'PRODUCT_MASTER') await ProductService.create(record);
                else if (this.activeSheet === 'ITEM_MASTER') await ItemService.create(record);
                
                NotificationService.showSuccess('New record generated');
            }
            this.loadMasterData();
            this.closeModal();
        } catch (err) {
            NotificationService.showError(`Sync interrupted: ${err.message}`);
        } finally {
            if (loader) loader.classList.remove('active');
        }
    },

    async handleDelete(recordId) {
        if (!confirm('Are you sure you want to soft-delete this record?')) return;
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('active');
        try {
            if (this.activeSheet === 'CUSTOMER_MASTER') await CustomerService.delete(recordId);
            else if (this.activeSheet === 'VENDOR_MASTER') await VendorService.delete(recordId);
            else if (this.activeSheet === 'PRODUCT_MASTER') await ProductService.delete(recordId);
            else if (this.activeSheet === 'ITEM_MASTER') await ItemService.delete(recordId);
            NotificationService.showSuccess('Record flagged deleted');
            this.loadMasterData();
        } catch (err) {
            NotificationService.showError(`Deletion aborted: ${err.message}`);
        } finally {
            if (loader) loader.classList.remove('active');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MastersManager.initialize();
    window.MastersManager = MastersManager;
});
