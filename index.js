const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    // هذي المرة بنطبع الـ QR في الكونسول مباشرة، جرب تصوره من بعيد بدون روابط
    require('qrcode-terminal').generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('تم الربط بنجاح يا مولاي!');
});

client.initialize();
