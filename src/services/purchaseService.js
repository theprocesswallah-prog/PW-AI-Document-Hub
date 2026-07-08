/**
 * Processwallah OCR Engine V1.0 - Purchase Ledger Service
 * Version 1.0.0
 */
const PurchaseService = {
    async getRegister() {
        if (!window.supabaseClient) throw new Error("Database offline.");
        const { data, error } = await window.supabaseClient.from('purchase_register').select('*, vendor_master(vendor_name)').is('deleted_at', null).order('invoice_date', { ascending: false });
        if (error) throw error;
        return data;
    },
    async commitRecord(purchaseRecord) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        const { data, error } = await window.supabaseClient.from('purchase_register').insert([purchaseRecord]).select();
        if (error) throw error;
        return data[0];
    },
    async deleteRecord(recordId) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        const payload = { deleted_at: new Date().toISOString() };
        const { error } = await window.supabaseClient.from('purchase_register').update(payload).eq('purchase_record_id', recordId);
        if (error) throw error;
        return true;
    }
};
window.PurchaseService = PurchaseService;
