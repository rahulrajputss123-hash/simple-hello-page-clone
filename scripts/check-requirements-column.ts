import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Check if requirements_manual column exists
  const { data, error } = await supabase
    .rpc('execute_sql', { 
      query: `SELECT column_name, data_type, column_default 
              FROM information_schema.columns 
              WHERE table_name = 'offers' 
              AND column_name ILIKE '%requirement%';`
    });
  
  console.log("Requirements columns:", data || error);
}

main();
