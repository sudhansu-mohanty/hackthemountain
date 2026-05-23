import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[BioForm Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. ' +
    'Please set these environment variables in your .env file to enable Community Feed and Dashboard functionality.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
