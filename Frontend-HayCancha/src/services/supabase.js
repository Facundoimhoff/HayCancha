import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY (ver .env.example).');
}

// Solo la anon key va al navegador. La service_role key NUNCA debe usarse en el frontend:
// la seguridad de los datos la imponen las policies RLS (supabase/migrations).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
