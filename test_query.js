const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://pltyijauozdsxbdpluxw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHlpamF1b3pkc3hiZHBsdXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDA3NTQsImV4cCI6MjA4ODA3Njc1NH0.Uin3mcYosvWHP5ZQHtN8uFdWySeit8pS5UuKIlmnu7A";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const rpcs = ['exec_sql', 'execute_sql', 'run_sql', 'sql', 'query'];
  for (const rpc of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpc, { sql: 'SELECT 1' });
      console.log(`RPC ${rpc} response:`, { data, error });
    } catch (e) {
      console.log(`RPC ${rpc} exception:`, e.message);
    }
  }
}
run();
