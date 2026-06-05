const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/usr/bin/chromium-browser', // جرب هذا المسار
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
});

let latestQr = '';
client.on('qr', (qr) => { latestQr = qr; });

app.get('/qr', async (req, res) => {
    if (!latestQr) return res.send('جاري التحضير يا مولاي..');
    const url = await qrcode.toDataURL(latestQr);
    res.send(`<img src="${url}" />`);
});

client.on('ready', () => console.log('تم الربط يا مولاي!'));
client.initialize();
app.listen(port, () => console.log(`شغال على بورت ${port}`));
