import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// `configured` lets callers gracefully fall back (e.g. the public gallery
// still renders from the bundled seed data when Supabase isn't reachable).
export const configured = Boolean(supabaseUrl && supabaseKey);

export const supabase = configured ? createClient(supabaseUrl, supabaseKey) : null;
