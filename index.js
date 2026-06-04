const { Client, LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');
const qrcode = require('qrcode-terminal');

const client = new Client({ authStrategy: new LocalAuth() });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('امسح الباركود بجوالك!');
});

client.on('ready', () => {
    console.log('البوت شغال يا مولاي!');
    
    supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, payload => {
        const phone = payload.new.customer_phone;
        client.sendMessage(phone + '@c.us', 'هلا في ركائب! نورتنا.');
      })
      .subscribe();
});

client.initialize();
