/**
 * Processwallah OCR Engine V1.0 - Vendor Master Service
 * Version 1.0.0
 * Handles database operations for vendor records using the Supabase Client API.
 */

const VendorService = {
    /**
     * Retrieves all vendor records that have not been soft deleted.
     * Optionally filters results using a search query.
     * @param {string} [searchQuery=""] Search query string matching names, codes, or GSTINs
     * @returns {Promise<Array>} Array of verified vendor records
     */
    async getAll(searchQuery = "") {
        if (!window.supabaseClient) {
            throw new Error("Supabase Client is offline. Configure API credentials in Settings.");
        }

        let query = window.supabaseClient
            .from('vendor_master')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (searchQuery.trim() !== "") {
            const cleanQuery = `%${searchQuery.trim()}%`;
            query = query.or(`vendor_code.ilike.${cleanQuery},vendor_name.ilike.${cleanQuery},gst_number.ilike.${cleanQuery}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Failed to retrieve vendor records:", error.message);
            throw error;
        }

        return data;
    },

    /**
     * Inserts a new vendor record into the database
     * @param {Object} vendorData Vendor record matching schema fields
     * @returns {Promise<Object>} The newly created record
     */
    async create(vendorData) {
        if (!window.supabaseClient) throw new Error("Supabase Client is offline.");

        delete vendorData.vendor_id;
        delete vendorData.created_at;
        delete vendorData.updated_at;
        delete vendorData.deleted_at;

        // Fetch current user session to write audit trail
        const user = await window.supabaseClient.auth.getUser();
        if (user && user.data && user.data.user) {
            vendorData.created_by = user.data.user.id;
        }

        const { data, error } = await window.supabaseClient
            .from('vendor_master')
            .insert([vendorData])
            .select();

        if (error) throw error;

        // Log to system activity logs
        try {
            if (user && user.data && user.data.user) {
                await window.supabaseClient.from('system_activity_logs').insert([{
                    triggered_by: user.data.user.id,
                    action_type: 'Create',
                    target_table: 'vendor_master',
                    record_id: data[0].vendor_id,
                    message: `Vendor created: ${data[0].vendor_name} (${data[0].vendor_code})`
                }]);
            }
        } catch (e) {}

        return data[0];
    },

    /**
     * Overwrites an existing vendor record matching the profile ID
     * @param {string} vendorId UUID reference matching primary key
     * @param {Object} vendorData Mapped elements to update
     * @returns {Promise<Object>} The updated row record
     */
    async update(vendorId, vendorData) {
        if (!window.supabaseClient) throw new Error("Supabase Client is offline.");

        vendorData.updated_at = new Date().toISOString();

        // Fetch current user session to write audit trail
        const user = await window.supabaseClient.auth.getUser();
        if (user && user.data && user.data.user) {
            vendorData.updated_by = user.data.user.id;
        }

        const { data, error } = await window.supabaseClient
            .from('vendor_master')
            .update(vendorData)
            .eq('vendor_id', vendorId)
            .select();

        if (error) throw error;

        // Log to system activity logs
        try {
            if (user && user.data && user.data.user) {
                await window.supabaseClient.from('system_activity_logs').insert([{
                    triggered_by: user.data.user.id,
                    action_type: 'Update',
                    target_table: 'vendor_master',
                    record_id: vendorId,
                    message: `Vendor updated: ${data[0].vendor_name}`
                }]);
            }
        } catch (e) {}

        return data[0];
    },

    /**
     * Performs a soft delete on a vendor record by setting its deleted_at timestamp
     * @param {string} vendorId Unique UUID matching primary key
     * @returns {Promise<boolean>} True if delete complete
     */
    async delete(vendorId) {
        if (!window.supabaseClient) throw new Error("Supabase Client is offline.");

        const user = await window.supabaseClient.auth.getUser();
        const deletePayload = {
            deleted_at: new Date().toISOString()
        };

        if (user && user.data && user.data.user) {
            deletePayload.updated_by = user.data.user.id;
        }

        const { error } = await window.supabaseClient
            .from('vendor_master')
            .update(deletePayload)
            .eq('vendor_id', vendorId);

        if (error) throw error;

        // Log soft-delete action
        try {
            if (user && user.data && user.data.user) {
                await window.supabaseClient.from('system_activity_logs').insert([{
                    triggered_by: user.data.user.id,
                    action_type: 'Delete',
                    target_table: 'vendor_master',
                    record_id: vendorId,
                    message: `Vendor record soft deleted: ${vendorId}`
                }]);
            }
        } catch (e) {}

        return true;
    }
};

window.VendorService = VendorService;
