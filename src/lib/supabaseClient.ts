/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// Check for both Vite and Next.js environment variable formats
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://xyzcompany.supabase.co'; // Fallback for development

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbmRvbSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjEzMDkyNTQwLCJleHAiOjE5Mjg2NjcwNDB9.random'; // Fallback for development

// Only show warning in production
if (process.env.NODE_ENV === 'production') {
  if (!supabaseUrl || supabaseUrl === 'https://xyzcompany.supabase.co') {
    console.error('Error: Supabase URL is not defined. Check your environment variables.');
  }
  
  if (!supabaseAnonKey || supabaseAnonKey.includes('random')) {
    console.error('Error: Supabase Anon Key is not defined. Check your environment variables.');
  }
} else {
  // In development mode, provide helpful message
  if (supabaseUrl === 'https://xyzcompany.supabase.co') {
    console.warn('Using development fallback for Supabase URL. Create a .env file with VITE_SUPABASE_URL for proper configuration.');
  }
  
  if (supabaseAnonKey.includes('random')) {
    console.warn('Using development fallback for Supabase Anon Key. Create a .env file with VITE_SUPABASE_ANON_KEY for proper configuration.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
