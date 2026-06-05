const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox'],
        // هنا السر: نخليه يتنكر كمتصفح كروم حقيقي على ويندوز
        executablePath: '/usr/bin/google-chrome',
        userDataDir: './.wwebjs_auth'
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
});

client.on('qr', (qr) => {
    // هذا بيطلع الكود بشكل أوضح في التيرمينال
    require('qrcode-terminal').generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('البوت شغال يا مولاي!');
});

client.initialize();
