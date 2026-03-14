import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;
  const supabase = createClient(url, key);
  const login = process.env.ADMIN_LOGIN || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'TajPaintball2024!';
  const hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase.from('admins')
    .upsert({ login, password_hash: hash, role: 'superadmin', full_name: 'Администратор' }, { onConflict: 'login' })
    .select().single();
  if (error) { console.error('Error:', error.message); process.exit(1); }
  console.log(`✅ Admin created: ${data.login}`);
}
main();
