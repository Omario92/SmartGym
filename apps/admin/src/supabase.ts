import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://cwtjnruqsblvvndhklfb.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dGpucnVxc2JsdnZuZGhrbGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjIzNTUsImV4cCI6MjA5MzUzODM1NX0.RRU996DKn10i6EnUIJd3ZedoZTLlvNA-wWdQ4MazDcM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
