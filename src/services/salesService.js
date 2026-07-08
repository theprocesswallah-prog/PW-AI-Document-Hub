/**
 * Processwallah OCR Engine V1.0 - Sales Ledger Service
 * Version 1.0.0
 */
const SalesService = {
    async getRegister() {
        if (!window.supabaseClient) throw new Error("Database offline.");
        const { data, error } = await window.supabaseClient.from('sales_register').select('*, customer_master(customer_name)').is('deleted_at', null).order('invoice_date', { ascending: false });
        if (error) throw error;
        return data;
    },
    async commitRecord(salesRecord) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        const { data, error } = await window.supabaseClient.from('sales_register').insert([salesRecord]).select();
        if (error) throw error;
        return data[0];
    },
    async deleteRecord(recordId) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        const payload = { deleted_at: new Date().toISOString() };
        const { error } = await window.supabaseClient.from('sales_register').update(payload).eq('sales_record_id', recordId);
        if (error) throw error;
        return true;
    }
};
window.SalesService = SalesService;
