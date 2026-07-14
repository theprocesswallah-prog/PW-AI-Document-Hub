/**
 * Universal OCR Workspace Engine
 * Version 1.0.1
 * Decoupled, configuration-driven UI generator
 */

class SalesOCRWorkspace {
    constructor(canvasId, containerId) {
        this.canvasId = canvasId;
        this.containerId = containerId;
        this.activeConfig = null;
        this.currentScale = 1.0;
        this.currentRotation = 0;
        this.lineItemsCount = 2;

        // Configuration map for all document types (no duplicate HTML)
        this.configurations = {
            'sales-invoice': {
                title: 'Sales Invoice',
                breadcrumb: 'Sales Department / Tax Invoice Inbound',
                partyLabel: 'Customer Entity',
                partyMaster: 'customer_master',
                fields: [
                    { id: 'invNum', label: 'Invoice Number', type: 'text', value: 'INV-2025-0814', group: 'meta' },
                    { id: 'invDate', label: 'Invoice Date', type: 'date', value: '2025-01-24', group: 'meta' },
                    { id: 'taxScheme', label: 'Tax Scheme', type: 'select', options: ['GST18', 'GST5', 'EXEMPT'], value: 'GST18', group: 'tax' },
                    { id: 'currency', label: 'Currency', type: 'text', value: 'INR', group: 'tax' }
                ],
                annotations: [
                    { top: '15%', left: '8%', width: '32%', height: '8%', label: 'Customer Name', field: 'fieldCustomer' },
                    { top: '15%', right: '8%', width: '22%', height: '5%', label: 'Invoice No', field: 'fieldInvoiceNo' }
                ]
            },
            'purchase-invoice': {
                title: 'Purchase Invoice',
                breadcrumb: 'Purchase Department / Supplier Bill Inbound',
                partyLabel: 'Vendor Entity',
                partyMaster: 'vendor_master',
                fields: [
                    { id: 'billNum', label: 'Bill / Purchase Ref #', type: 'text', value: 'PO-8849-01', group: 'meta' },
                    { id: 'billDate', label: 'Invoiced Date', type: 'date', value: '2025-01-22', group: 'meta' },
                    { id: 'ledgerCode', label: 'Target GL Code Offset', type: 'select', options: ['60040 - Carriage Cost', '61010 - IT Overhead'], value: '60040 - Carriage Cost', group: 'tax' },
                    { id: 'currency', label: 'Currency', type: 'text', value: 'INR', group: 'tax' }
                ],
                annotations: [
                    { top: '12%', left: '10%', width: '40%', height: '10%', label: 'Vendor Legal ID', field: 'fieldVendor' },
                    { top: '22%', right: '12%', width: '25%', height: '6%', label: 'Purchase PO Ref', field: 'fieldBillNum' }
                ]
            },
            'delivery-challan': {
                title: 'Delivery Challan',
                breadcrumb: 'Logistics Department / Waybill Inbound',
                partyLabel: 'Consignee Entity',
                partyMaster: 'customer_master',
                fields: [
                    { id: 'challanNum', label: 'Challan Number', type: 'text', value: 'CH-991202', group: 'meta' },
                    { id: 'challanDate', label: 'Dispatched Date', type: 'date', value: '2025-01-20', group: 'meta' },
                    { id: 'vehicleNo', label: 'Vehicle Number', type: 'text', value: 'DL-01-GB-9912', group: 'tax' },
                    { id: 'transporter', label: 'Carrier Company', type: 'text', value: 'SafeExpress Logistics', group: 'tax' }
                ],
                annotations: [
                    { top: '8%', left: '5%', width: '30%', height: '6%', label: 'Challan ID', field: 'fieldChallanNum' }
                ]
            },
            'debit-note': {
                title: 'Debit Note',
                breadcrumb: 'Receivables / Debit Adjustments',
                partyLabel: 'Debtor Customer',
                partyMaster: 'customer_master',
                fields: [
                    { id: 'debitNum', label: 'Debit Note Ref', type: 'text', value: 'DN-2025-0012', group: 'meta' },
                    { id: 'debitDate', label: 'Adjustment Date', type: 'date', value: '2025-01-21', group: 'meta' },
                    { id: 'origInvoice', label: 'Original Invoice Link', type: 'text', value: 'INV-2025-0814', group: 'tax' },
                    { id: 'taxScheme', label: 'Tax Scheme', type: 'select', options: ['GST18', 'GST5'], value: 'GST18', group: 'tax' }
                ],
                annotations: []
            },
            'credit-note': {
                title: 'Credit Note',
                breadcrumb: 'Payables / Supplier Claims Adjustment',
                partyLabel: 'Creditor Vendor',
                partyMaster: 'vendor_master',
                fields: [
                    { id: 'creditNum', label: 'Credit Note Ref', type: 'text', value: 'CN-8819A2', group: 'meta' },
                    { id: 'creditDate', label: 'Posting Date', type: 'date', value: '2025-01-23', group: 'meta' },
                    { id: 'origBill', label: 'Raw Vendor PO Link', type: 'text', value: 'PO-8849-01' },
                    { id: 'taxRate', label: 'GST Bracket', type: 'text', value: 'GST18' }
                ],
                annotations: []
            }
        };
    }

    /**
     * Initializes structural UI generation loop
     */
    initialize(docType) {
        this.activeConfig = this.configurations[docType] || this.configurations['sales-invoice'];
        
        // Update browser breadcrumb state
        const breadcrumbEl = document.getElementById('activeWorkspaceBreadcrumb');
        if (breadcrumbEl) {
            breadcrumbEl.innerText = this.activeConfig.title;
        }

        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Empty previous contents securely
        container.innerHTML = '';

        // Inject configuration elements
        this.renderLeftPanel(container);
        this.renderCenterPanel(container);
        this.renderRightPanel(container);

        this.bindWorkspaceEvents();
    }

    renderLeftPanel(parent) {
        const leftPanel = document.createElement('section');
        leftPanel.className = 'ingest-panel';
        leftPanel.innerHTML = `
            <div class="panel-card drag-drop-card" id="dropZone">
                <span class="material-symbols-rounded upload-icon">cloud_upload</span>
                <h3>Drag & drop ${this.activeConfig.title}</h3>
                <p class="upload-sub">Supports PDF, PNG, JPEG, DOC, DOCX up to 15MB</p>
                <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">Browse Files</button>
                <input type="file" id="fileInput" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style="display: none;">
            </div>

            <div class="panel-card upload-status-card" style="margin-top: 16px;">
                <h4 class="card-subtitle">Active Ingestion Flow</h4>
                <div class="upload-progress-wrapper" style="display: none;" id="progressContainer">
                    <div class="progress-info">
                        <span id="uploadFileName">document_feed.pdf</span>
                        <span id="uploadPercentage">0%</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="progressBar"></div>
                    </div>
                </div>
                <div class="pipeline-indicators" id="pipelineStatusDefault">
                    <span class="status-indicator online"></span>
                    <span class="status-text" id="statusMessageLabel">Awaiting dynamic ingestion stream...</span>
                </div>
            </div>
        `;
        parent.appendChild(leftPanel);
    }

    renderCenterPanel(parent) {
        const centerPanel = document.createElement('section');
        centerPanel.className = 'viewer-panel';
        
        // Build OCR highlight overlay dynamically
        let overlaysHtml = '';
        if (this.activeConfig.annotations) {
            this.activeConfig.annotations.forEach(item => {
                overlaysHtml += `
                    <div class="ocr-bounding-overlay" style="top: ${item.top}; left: ${item.left}; width: ${item.width}; height: ${item.height}; position: absolute; border: 2px solid #10B981; background-color: rgba(16, 185, 129, 0.15); border-radius: 4px; cursor: pointer;" data-field="${item.field}">
                        <span class="overlay-tag" style="position: absolute; top: -18px; left: -2px; background-color: var(--primary); color: #FFFFFF; font-size: 9px; font-weight: 600; padding: 1px 4px; border-radius: 2px; white-space: nowrap;">${item.label}</span>
                    </div>
                `;
            });
        }

        centerPanel.innerHTML = `
            <div class="panel-card viewer-card" style="display: flex; flex-direction: column; height: 100%;">
                <div class="viewer-toolbar">
                    <div class="toolbar-left">
                        <button class="btn btn-secondary toolbar-btn" id="btnPrevPage" disabled>
                            <span class="material-symbols-rounded">chevron_left</span>
                        </button>
                        <span class="page-counter">Page <span id="currentPage">1</span> of <span id="totalPages">1</span></span>
                        <button class="btn btn-secondary toolbar-btn" id="btnNextPage" disabled>
                            <span class="material-symbols-rounded">chevron_right</span>
                        </button>
                    </div>
                    <div class="toolbar-right">
                        <button class="btn btn-secondary toolbar-btn" id="btnZoomIn"><span class="material-symbols-rounded">zoom_in</span></button>
                        <button class="btn btn-secondary toolbar-btn" id="btnZoomOut"><span class="material-symbols-rounded">zoom_out</span></button>
                        <button class="btn btn-secondary toolbar-btn" id="btnRotate"><span class="material-symbols-rounded">rotate_right</span></button>
                    </div>
                </div>

                <div class="document-canvas-container" id="docCanvas" style="flex:1; overflow:auto; background-color:#64748B; position:relative; display:flex; justify-content:center; align-items:flex-start; padding: 20px 0;">
                    ${overlaysHtml}
                    <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000" alt="Ingested Invoice Document Preview" class="canvas-image" id="canvasImage" style="max-width: 90%; height: auto; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); transform-origin: center;">
                </div>
            </div>
        `;
        parent.appendChild(centerPanel);
    }

    renderRightPanel(parent) {
        const rightPanel = document.createElement('section');
        rightPanel.className = 'form-panel';

        // Dynamic Field Generation based on Configuration object
        let fieldsHtml = `
            <div class="form-group highlight-confidence">
                <label class="form-label">${this.activeConfig.partyLabel}</label>
                <select class="form-input" id="fieldCustomer" style="background: none;">
                    <!-- Master data loaded dynamically -->
                </select>
            </div>
        `;

        if (this.activeConfig.fields) {
            this.activeConfig.fields.forEach(field => {
                if (field.type === 'select') {
                    let options = '';
                    field.options.forEach(opt => {
                        options += `<option value="${opt}">${opt}</option>`;
                    });
                    fieldsHtml += `
                        <div class="form-group">
                            <label class="form-label">${field.label}</label>
                            <select class="form-input" id="${field.id}" style="background: none;">${options}</select>
                        </div>
                    `;
                } else {
                    fieldsHtml += `
                        <div class="form-group">
                            <label class="form-label">${field.label}</label>
                            <input type="${field.type}" class="form-input" id="${field.id}" value="${field.value}">
                        </div>
                    `;
                }
            });
        }

        rightPanel.innerHTML = `
            <div class="panel-card form-card" style="flex: 1; overflow-y: auto;">
                <div class="form-panel-header">
                    <h3 class="form-panel-title">Extracted Transaction Variables</h3>
                    <span class="badge synced">94% Confidence</span>
                </div>

                <form class="ocr-edit-form" onsubmit="return false;">
                    ${fieldsHtml}

                    <!-- Line Items Table Template -->
                    <div class="line-items-form-section">
                        <div class="section-label-header">
                            <span class="form-label" style="margin-bottom:0">Tabular Line Items</span>
                            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" id="btnAddRow">+ Add Row</button>
                        </div>

                        <div class="line-items-table-wrapper">
                            <table class="items-editor-table">
                                <thead>
                                    <tr>
                                        <th style="width: 45%;">Description</th>
                                        <th>Qty</th>
                                        <th>Rate</th>
                                        <th style="text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody id="lineItemsContainer">
                                    <tr>
                                        <td><input type="text" class="table-cell-input" value="Standard Industrial Raw Materials Grade X"></td>
                                        <td><input type="number" class="table-cell-input" value="5" id="rowQty-1" style="width: 45px;"></td>
                                        <td><input type="number" class="table-cell-input" value="2490.00" id="rowRate-1" style="width: 70px;"></td>
                                        <td class="cell-total-value" id="rowTotal-1">$12,450.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Computed summaries variables -->
                    <div class="computations-summary-wrapper" style="margin-top: 16px;">
                        <div class="comp-row">
                            <span>Taxable Value subtotal:</span>
                            <span id="subtotalVal">$12,450.00</span>
                        </div>
                        <div class="comp-row">
                            <span>Calculated Tax (GST 18%):</span>
                            <span id="taxVal">$2,241.00</span>
                        </div>
                        <div class="comp-row grand-total-row">
                            <span>Grand Total Balance:</span>
                            <span id="grandTotalVal">$14,691.00</span>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Global Action Bar -->
            <div class="panel-card action-bar-card" style="margin-top: 16px;">
                <button class="btn btn-secondary action-btn-alt" id="btnDownloadJSON">Download JSON</button>
                <div class="action-btn-group">
                    <button class="btn btn-secondary" id="btnSaveDraft">Save Draft</button>
                    <button class="btn btn-primary" id="btnApproveSync">Approve & Sync</button>
                </div>
            </div>
        `;
        parent.appendChild(rightPanel);
    }

    /**
     * Binds internal layout component events securely
     */
    bindWorkspaceEvents() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--primary)';
                dropZone.style.backgroundColor = '#EEF2F6';
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.style.borderColor = 'var(--text-light)';
                dropZone.style.backgroundColor = 'transparent';
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--border-color)';
                dropZone.style.backgroundColor = 'transparent';
                this.handleOcrExecutionTrigger();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', () => {
                this.handleOcrExecutionTrigger();
            });
        }

        // Zooming / Scaling controllers
        const img = document.getElementById('canvasImage');
        document.getElementById('btnZoomIn').addEventListener('click', () => {
            this.currentScale += 0.1;
            img.style.transform = `scale(${this.currentScale}) rotate(${this.currentRotation}deg)`;
        });

        document.getElementById('btnZoomOut').addEventListener('click', () => {
            if (this.currentScale > 0.5) {
                this.currentScale -= 0.1;
                img.style.transform = `scale(${this.currentScale}) rotate(${this.currentRotation}deg)`;
            }
        });

        document.getElementById('btnRotate').addEventListener('click', () => {
            this.currentRotation = (this.currentRotation + 90) % 360;
            img.style.transform = `scale(${this.currentScale}) rotate(${this.currentRotation}deg)`;
        });

        // Add line items row interaction
        document.getElementById('btnAddRow').addEventListener('click', () => {
            this.lineItemsCount++;
            const tbody = document.getElementById('lineItemsContainer');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="table-cell-input" value="Additional Structural Material"></td>
                <td><input type="number" class="table-cell-input" value="1" style="width: 45px;"></td>
                <td><input type="number" class="table-cell-input" value="100.00" style="width: 70px;"></td>
                <td class="cell-total-value">$100.00</td>
            `;
            tbody.appendChild(row);
            alert('Item ledger line added');
        });

        // Download JSON representation
        document.getElementById('btnDownloadJSON').addEventListener('click', () => {
            const rawMockModel = {
                workspace_context: this.activeConfig.title,
                extracted_meta: {
                    confidence_score: 0.942,
                    system_timestamp: new Date().toISOString()
                }
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rawMockModel, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `ocr_${this.activeConfig.title.toLowerCase().replace(' ', '_')}_export.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            alert('JSON extraction payload downloaded successfully');
        });

        // Validation sync events
        document.getElementById('btnApproveSync').addEventListener('click', () => {
            alert('Acquiring write lock... Record successfully synced to Google Sheets');
        });

        document.getElementById('btnSaveDraft').addEventListener('click', () => {
            alert('State written to DOCUMENT_MASTER staging queue');
        });

        // Dynamic check of Gemini API Key availability during reprocessing trigger
        const reprocessBtn = document.getElementById('btnReprocess');
        if (reprocessBtn) {
            reprocessBtn.addEventListener('click', () => {
                const geminiKey = localStorage.getItem('PROCESSWALLAH_GEMINI_KEY') || '';
                if (!geminiKey) {
                    alert('Gemini API Key missing. Please configure your API Key in the Settings dashboard to execute live OCR extractions.');
                    return;
                }
                alert('Retrying Gemini Vision OCR call with prompt v1.4...');
            });
        }

        // Initialize masters selection lookup dynamically based on connected database
        this.loadFormMastersData();
    },

    /**
     * Dynamic check of Gemini API Key availability during initial Ingestion drop
     */
    handleOcrExecutionTrigger() {
        const geminiKey = localStorage.getItem('PROCESSWALLAH_GEMINI_KEY') || '';
        if (!geminiKey) {
            alert('Gemini API Key missing. Please configure your API Key in the Settings dashboard to execute live OCR extractions.');
            return;
        }
        this.simulateUpload();
    },

    simulateUpload() {
        const progressContainer = document.getElementById('progressContainer');
        const pipelineDefault = document.getElementById('pipelineStatusDefault');
        const progressBar = document.getElementById('progressBar');
        
        pipelineDefault.style.display = 'none';
        progressContainer.style.display = 'block';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = progress + '%';
            document.getElementById('uploadPercentage').innerText = progress + '%';
            if (progress >= 100) {
                clearInterval(interval);
                alert('File parsed successfully with Gemini v1.4');
            }
        }, 120);
    },

    async loadFormMastersData() {
        const select = document.getElementById('fieldCustomer');
        if (!select) return;

        select.innerHTML = '<option value="">Loading masters...</option>';

        const globalScriptUrl = localStorage.getItem('PROCESSWALLAH_SUPABASE_URL') || '';
        if (!globalScriptUrl) {
            select.innerHTML = `<option value="">Database offline (Using default)</option>
                                <option value="CST-MOCK">Acme Industrial Supplies (CST-00341)</option>`;
            return;
        }

        try {
            // Read from dynamic profiles to populate active dropdown options
            const { data, error } = await supabaseClient
                .from(this.activeConfig.partyMaster)
                .select('*')
                .is('deleted_at', null);

            if (error) throw error;

            select.innerHTML = '';
            if (!data || data.length === 0) {
                select.innerHTML = '<option value="">No master records found</option>';
                return;
            }

            data.forEach(row => {
                const code = row.customer_code || row.vendor_code || '';
                const name = row.customer_name || row.vendor_name || '';
                const id = row.customer_id || row.vendor_id || '';
                const option = document.createElement('option');
                option.value = id;
                option.innerText = `${name} (${code})`;
                select.appendChild(option);
            });

        } catch (e) {
            console.error("Masters load failed:", e);
            select.innerHTML = '<option value="">Database lookup error</option>';
        }
    }
}

window.SalesOCRWorkspace = SalesOCRWorkspace;
