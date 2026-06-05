const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
});

client.on('qr', (qr) => {
    // هذا السطر بيعطيك رابط مباشر للصورة، اضغط عليه وبيفتح الـ QR بوضوح
    console.log('QR RECEIVED - COPY THIS LINK TO BROWSER:');
    console.log('https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURIComponent(qr));
});

client.on('ready', () => {
    console.log('البوت شغال يا مولاي!');
});

client.initialize();
