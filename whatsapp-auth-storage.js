const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'whatsapp-auth';
const LOCAL_DIR = path.resolve(process.cwd(), 'auth_info');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function uploadAuthInfo() {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const files = await fs.readdir(LOCAL_DIR);
  for (const name of files) {
    const full = path.join(LOCAL_DIR, name);
    const stat = await fs.stat(full);
    if (!stat.isFile()) continue;
    const body = await fs.readFile(full);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(name, body, { upsert: true, contentType: 'application/octet-stream' });
    if (error) throw new Error('upload ' + name + ': ' + error.message);
  }
  console.log('تم رفع الجلسة لـ Supabase ✅ (' + files.length + ' ملفات)');
}

async function downloadAuthInfo() {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
  if (error) throw new Error('list: ' + error.message);
  if (!data || data.length === 0) {
    console.log('لا توجد جلسة محفوظة — تحتاج مسح QR');
    return;
  }
  for (const f of data) {
    const dl = await supabase.storage.from(BUCKET).download(f.name);
    if (dl.error) throw new Error('download ' + f.name + ': ' + dl.error.message);
    const buf = Buffer.from(await dl.data.arrayBuffer());
    await fs.writeFile(path.join(LOCAL_DIR, f.name), buf);
  }
  console.log('تم استعادة الجلسة من Supabase ✅ (' + data.length + ' ملفات)');
}

module.exports = { uploadAuthInfo, downloadAuthInfo, LOCAL_DIR };
