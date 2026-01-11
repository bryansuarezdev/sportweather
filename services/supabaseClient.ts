import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials not configured!');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    console.error('');
    console.error('📋 To fix this:');
    console.error('1. Create/edit .env.local file');
    console.error('2. Add your Supabase credentials:');
    console.error('   VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.error('   VITE_SUPABASE_ANON_KEY=your_anon_key_here');
    console.error('3. Restart the dev server: npm run dev');
    console.error('');
} else {
    console.log('✅ Supabase configured successfully');
    console.log('  URL:', supabaseUrl);
    console.log('  Key:', supabaseAnonKey.substring(0, 20) + '...');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
