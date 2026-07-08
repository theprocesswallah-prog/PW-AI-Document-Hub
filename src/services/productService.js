/**
 * Processwallah OCR Engine V1.0 - Product Master CRUD Service
 * Version 1.0.0
 */
const ProductService = {
    async getAll(searchQuery = "") {
        if (!window.supabaseClient) throw new Error("Database offline.");
        let query = window.supabaseClient.from('product_master').select('*').is('deleted_at', null).order('created_at', { ascending: false });
        if (searchQuery.trim() !== "") {
            const clean = `%${searchQuery.trim()}%`;
            query = query.or(`product_unique_id.ilike.${clean},product_name.ilike.${clean},product_sku.ilike.${clean}`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },
    async create(productData) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        delete productData.product_id;
        const user = await window.supabaseClient.auth.getUser();
        if (user?.data?.user) productData.created_by = user.data.user.id;
        const { data, error } = await window.supabaseClient.from('product_master').insert([productData]).select();
        if (error) throw error;
        return data[0];
    },
    async update(productId, productData) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        productData.updated_at = new Date().toISOString();
        const user = await window.supabaseClient.auth.getUser();
        if (user?.data?.user) productData.updated_by = user.data.user.id;
        const { data, error } = await window.supabaseClient.from('product_master').update(productData).eq('product_id', productId).select();
        if (error) throw error;
        return data[0];
    },
    async delete(productId) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        const user = await window.supabaseClient.auth.getUser();
        const payload = { deleted_at: new Date().toISOString() };
        if (user?.data?.user) payload.updated_by = user.data.user.id;
        const { error } = await window.supabaseClient.from('product_master').update(payload).eq('product_id', productId);
        if (error) throw error;
        return true;
    }
};
window.ProductService = ProductService;
