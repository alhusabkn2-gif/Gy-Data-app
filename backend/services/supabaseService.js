const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with service role key (server-side only)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = {
  supabaseAdmin,
};
