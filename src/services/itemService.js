/**
 * Processwallah OCR Engine V1.0 - Item Master CRUD Service
 * Version 1.0.0
 */
const ItemService = {
    async getAll(searchQuery = "") {
        if (!window.supabaseClient) throw new Error("Database offline.");
        let query = window.supabaseClient.from('item_master').select('*').is('deleted_at', null).order('created_at', { ascending: false });
        if (searchQuery.trim() !== "") {
            const clean = `%${searchQuery.trim()}%`;
            query = query.or(`item_code.ilike.${clean},item_name.ilike.${clean},item_group.ilike.${clean}`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },
    async create(itemData) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        delete itemData.item_id;
        const user = await window.supabaseClient.auth.getUser();
        if (user?.data?.user) itemData.created_by = user.data.user.id;
        const { data, error } = await window.supabaseClient.from('item_master').insert([itemData]).select();
        if (error) throw error;
        return data[0];
    },
    async update(itemId, itemData) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        itemData.updated_at = new Date().toISOString();
        const user = await window.supabaseClient.auth.getUser();
        if (user?.data?.user) itemData.updated_by = user.data.user.id;
        const { data, error } = await window.supabaseClient.from('item_master').update(itemData).eq('item_id', itemId).select();
        if (error) throw error;
        return data[0];
    },
    async delete(itemId) {
        if (!window.supabaseClient) throw new Error("Database offline.");
        const user = await window.supabaseClient.auth.getUser();
        const payload = { deleted_at: new Date().toISOString() };
        if (user?.data?.user) payload.updated_by = user.data.user.id;
        const { error } = await window.supabaseClient.from('item_master').update(payload).eq('item_id', itemId);
        if (error) throw error;
        return true;
    }
};
window.ItemService = ItemService;
