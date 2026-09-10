const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[DATABASE CONFIG ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY in environment variables.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Health check helper: verifies connectivity and latency to Supabase PostgreSQL.
 */
supabase.testDbConnection = async () => {
  const startTime = Date.now();
  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    const latencyMs = Date.now() - startTime;
    if (error) {
      return { ok: false, error: error.message, code: error.code, latencyMs };
    }
    return { ok: true, latencyMs };
  } catch (err) {
    return { ok: false, error: err.message, latencyMs: Date.now() - startTime };
  }
};

module.exports = supabase;