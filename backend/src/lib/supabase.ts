import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or key is missing in backend .env. Database calls will fail until they are set.');
}

export const supabase = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabaseKey || 'missing-service-role-key'
);