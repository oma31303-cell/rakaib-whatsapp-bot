const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');

const client = new Client({ authStrategy: new LocalAuth() });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// دالة تجيب الرسائل من قاعدة البيانات
async function getMessage(type) {
    const { data, error } = await supabase.from('whatsapp_settings').select(type).single();
    return data ? data[type] : "مرحباً بك في ركائب!";
}

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('البوت شغال يا مولاي ومستعد يقرأ إعداداتك!');

    supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, async (payload) => {
        const phone = payload.new.customer_phone;
        const msg = await getMessage('welcome_msg'); // يسحب الرسالة من الموقع
        client.sendMessage(phone + '@c.us', msg);
      })
      .subscribe();
});

client.initialize();
