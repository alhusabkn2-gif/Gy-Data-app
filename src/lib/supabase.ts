import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://bqfcerhgiqvheowruscs.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_c3Gk5YB29Wm25JKS4lvg1A_dASxlzEh";

if (!supabaseUrl) {
  throw new Error("supabaseUrl is required.");
}

if (!supabaseAnonKey) {
  throw new Error("supabaseKey is required.");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
