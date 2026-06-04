const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');
const http = require('http');

const client = new Client({ 
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// سيرفر صغير عشان السيرفر ما ينام (Ping)
http.createServer((req, res) => { res.end('I am alive!'); }).listen(process.env.PORT || 10000);

client.on('qr', (qr) => { qrcode.generate(qr, { small: true }); });

client.on('ready', () => { console.log('البوت صاحي يا مولاي!'); });

supabase.channel('custom-all-channel')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, async (payload) => {
    const phone = payload.new.customer_phone;
    const { data } = await supabase.from('whatsapp_settings').select('welcome_msg').single();
    const msg = data ? data.welcome_msg : "مرحباً بك في ركائب!";
    client.sendMessage(phone + '@c.us', msg);
  }).subscribe();

client.initialize();
