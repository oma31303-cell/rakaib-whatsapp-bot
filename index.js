const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => { qrcode.generate(qr, { small: true }); });
client.on('ready', () => { console.log('البوت صاحي يا مولاي!'); });
client.on('disconnected', (reason) => { console.log('انفصل البوت:', reason); });

client.initialize();

// حلقة انتظار عشان ما يطفي السيرفر
setInterval(() => { console.log("البوت صاحي ومستمر يا مولاي..."); }, 30000);

