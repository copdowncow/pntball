// @ts-nocheck
/* eslint-disable */
// Этот файл запускается напрямую через node, не через Next.js build
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const login = process.env.ADMIN_LOGIN || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'TajPaintball2024!';
  const hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('admins')
    .upsert({ login, password_hash: hash, role: 'superadmin', full_name: 'Администратор' }, { onConflict: 'login' })
    .select().single();

  if (error) { console.error('❌ Error:', error.message); process.exit(1); }
  console.log(`✅ Admin created: ${data.login}`);
}

main();
