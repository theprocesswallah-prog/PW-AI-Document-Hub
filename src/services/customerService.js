/**
 * Processwallah OCR Engine V1.0 - Customer Master Service
 * Version 1.0.0
 * Handles database operations for customer records using the Supabase Client API.
 */

const CustomerService = {
    /**
     * Retrieves all customer records that have not been soft deleted.
     * Optionally filters results using a search query.
     * @param {string} [searchQuery=""] Clean string for searching names, codes, or GSTINs
     * @returns {Promise<Array>} Array of verified customer records
     */
    async getAll(searchQuery = "") {
        if (!window.supabaseClient) {
            throw new Error("Supabase Client is offline. Configure API credentials in Settings.");
        }

        let query = window.supabaseClient
            .from('customer_master')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        // If search parameters are entered, search by code, name, or tax ID
        if (searchQuery.trim() !== "") {
            const cleanQuery = `%${searchQuery.trim()}%`;
            query = query.or(`customer_code.ilike.${cleanQuery},customer_name.ilike.${cleanQuery},gst_number.ilike.${cleanQuery}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Failed to retrieve customer records:", error.message);
            throw error;
        }

        return data;
    },

    /**
     * Inserts a new customer record into the database
     * @param {Object} customerData Customer record matching schema fields
     * @returns {Promise<Object>} The newly created record
     */
    async create(customerData) {
        if (!window.supabaseClient) throw new Error("Supabase Client is offline.");

        // Clear audit values before inserting
        delete customerData.customer_id;
        delete customerData.created_at;
        delete customerData.updated_at;
        delete customerData.deleted_at;

        // Fetch current user session to write audit trail
        const user = await window.supabaseClient.auth.getUser();
        if (user && user.data && user.data.user) {
            customerData.created_by = user.data.user.id;
        }

        const { data, error } = await window.supabaseClient
            .from('customer_master')
            .insert([customerData])
            .select();

        if (error) throw error;
        
        // Log to global system activity log
        try {
            if (user && user.data && user.data.user) {
                await window.supabaseClient.from('system_activity_logs').insert([{
                    triggered_by: user.data.user.id,
                    action_type: 'Create',
                    target_table: 'customer_master',
                    record_id: data[0].customer_id,
                    message: `Customer created: ${data[0].customer_name} (${data[0].customer_code})`
                }]);
            }
        } catch (e) {
            // Log audit trails silently without interrupting transaction
        }

        return data[0];
    },

    /**
     * Overwrites an existing customer record matching the profile ID
     * @param {string} customerId UUID reference matching primary key
     * @param {Object} customerData Mapped elements to update
     * @returns {Promise<Object>} The updated row record
     */
    async update(customerId, customerData) {
        if (!window.supabaseClient) throw new Error("Supabase Client is offline.");

        customerData.updated_at = new Date().toISOString();

        // Fetch current user session to write audit trail
        const user = await window.supabaseClient.auth.getUser();
        if (user && user.data && user.data.user) {
            customerData.updated_by = user.data.user.id;
        }

        const { data, error } = await window.supabaseClient
            .from('customer_master')
            .update(customerData)
            .eq('customer_id', customerId)
            .select();

        if (error) throw error;

        // Log to system activity logs
        try {
            if (user && user.data && user.data.user) {
                await window.supabaseClient.from('system_activity_logs').insert([{
                    triggered_by: user.data.user.id,
                    action_type: 'Update',
                    target_table: 'customer_master',
                    record_id: customerId,
                    message: `Customer updated: ${data[0].customer_name}`
                }]);
            }
        } catch (e) {}

        return data[0];
    },

    /**
     * Performs a soft delete on a customer record by setting its deleted_at timestamp
     * @param {string} customerId Unique UUID matching primary key
     * @returns {Promise<boolean>} True if delete complete
     */
    async delete(customerId) {
        if (!window.supabaseClient) throw new Error("Supabase Client is offline.");

        const user = await window.supabaseClient.auth.getUser();
        const deletePayload = {
            deleted_at: new Date().toISOString()
        };

        if (user && user.data && user.data.user) {
            deletePayload.updated_by = user.data.user.id;
        }

        const { error } = await window.supabaseClient
            .from('customer_master')
            .update(deletePayload)
            .eq('customer_id', customerId);

        if (error) throw error;

        // Log soft-delete action
        try {
            if (user && user.data && user.data.user) {
                await window.supabaseClient.from('system_activity_logs').insert([{
                    triggered_by: user.data.user.id,
                    action_type: 'Delete',
                    target_table: 'customer_master',
                    record_id: customerId,
                    message: `Customer record soft deleted: ${customerId}`
                }]);
            }
        } catch (e) {}

        return true;
    }
};

window.CustomerService = CustomerService;
