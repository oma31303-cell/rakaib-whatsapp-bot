const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.options('*', cors());
app.use(express.json());

let sock = null;
let isReady = false;
let latestQr = '';

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['Rakaib Farm', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      latestQr = qr;
      console.log('QR جاهز — افتح /qr');
    }
    if (connection === 'open') {
      isReady = true;
      latestQr = '';
      console.log('متصل بواتساب!');
    }
    if (connection === 'close') {
      isReady = false;
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log('إعادة الاتصال...');
        setTimeout(connect, 5000);
      } else {
        console.log('تم تسجيل الخروج — احذف مجلد auth_info');
      }
    }
  });
}

app.get('/', (req, res) => {
  res.json({ status: isReady ? 'online' : 'offline', service: 'Rakaib WhatsApp Bridge', qr_pending: !!latestQr });
});

app.get('/qr', async (req, res) => {
  if (isReady) return res.send('<h2 style="font-family:sans-serif;color:green;text-align:center;padding:40px">متصل بواتساب بنجاح!</h2>');
  if (!latestQr) return res.send('<h2 style="font-family:sans-serif;text-align:center;padding:40px">جاري التحضير... حدث الصفحة بعد 15 ثانية</h2><script>setTimeout(()=>location.reload(),15000)</script>');
  const url = await qrcode.toDataURL(latestQr);
  res.send('<html dir="rtl"><body style="font-family:sans-serif;text-align:center;padding:40px;background:#111;color:white"><h2>امسح الكود بواتساب</h2><p style="color:#aaa">واتساب - النقاط الثلاث - الاجهزة المرتبطة - ربط جهاز</p><img src="' + url + '" style="width:280px;height:280px;border-radius:12px"/><p style="color:#555;font-size:13px">بعد المسح حدث الصفحة</p><script>setTimeout(()=>location.reload(),30000)</script></body></html>');
});

app.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ ok: false, error: 'مطلوب phone و message' });
  if (!isReady) return res.status(503).json({ ok: false, error: 'واتساب غير متصل بعد' });
  try {
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('05')) cleaned = '966' + cleaned.slice(1);
    else if (cleaned.startsWith('5')) cleaned = '966' + cleaned;
    await sock.sendMessage(cleaned + '@s.whatsapp.net', { text: message });
    console.log('ارسلت ل ' + cleaned);
    res.json({ ok: true, id: 'msg-' + Date.now() });
  } catch (err) {
    console.error('فشل: ' + err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log('جسر ركايب على البورت ' + port);
  connect();
});
