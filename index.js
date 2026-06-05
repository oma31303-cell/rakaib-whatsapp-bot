const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 8080;
app.use(express.json());

let sock = null;
let isReady = false;
let latestQr = '';

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    connectTimeoutMs: 60000,
    qrTimeout: 60000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQr = qr;
      console.log('✅ QR جاهز!');
    }

    if (connection === 'open') {
      isReady = true;
      latestQr = '';
      console.log('✅ متصل بواتساب!');
    }

    if (connection === 'close') {
      isReady = false;
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log('انقطع — كود: ' + code);
      if (code === DisconnectReason.loggedOut) {
        console.log('تسجيل خروج — يجب مسح QR من جديد');
        latestQr = '';
        setTimeout(connect, 3000);
      } else {
        setTimeout(connect, 5000);
      }
    }
  });
}

app.get('/', (req, res) => {
  res.json({
    status: isReady ? 'online' : 'offline',
    service: 'Rakaib WhatsApp Bridge',
    qr_pending: !!latestQr,
  });
});

app.get('/qr', async (req, res) => {
  if (isReady) {
    return res.send('<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#111;color:#4ade80"><h2>✅ متصل بواتساب بنجاح!</h2></body></html>');
  }
  if (!latestQr) {
    return res.send('<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#111;color:white"><h2>⏳ جاري التحضير...</h2><p style="color:#aaa">حدّث الصفحة بعد 15 ثانية</p><script>setTimeout(()=>location.reload(),15000)</script></body></html>');
  }
  const url = await qrcode.toDataURL(latestQr, { width: 300 });
  res.send('<html dir="rtl"><body style="font-family:sans-serif;text-align:center;padding:40px;background:#111;color:white"><h2>📱 امسح الكود بواتساب</h2><p style="color:#aaa">واتساب ← النقاط الثلاث ← الأجهزة المرتبطة ← ربط جهاز</p><img src="' + url + '" style="width:300px;height:300px;border-radius:12px;margin:20px auto;display:block"/><p style="color:#555;font-size:13px">بعد المسح حدّث الصفحة</p><script>setTimeout(()=>location.reload(),30000)</script></body></html>');
});

app.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ ok: false, error: 'مطلوب phone و message' });
  if (!isReady) return res.status(503).json({ ok: false, error: 'واتساب غير متصل' });
  try {
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('05')) cleaned = '966' + cleaned.slice(1);
    else if (cleaned.startsWith('5')) cleaned = '966' + cleaned;
    await sock.sendMessage(cleaned + '@s.whatsapp.net', { text: message });
    console.log('📨 أُرسلت لـ ' + cleaned);
    res.json({ ok: true, id: 'msg-' + Date.now() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log('🚀 جسر ركايب على البورت ' + port);
  connect();
});
