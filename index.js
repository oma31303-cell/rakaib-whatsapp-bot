const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// ─── إعداد الكلايمت ────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  },
});

let isReady = false;
let latestQr = '';

// ─── QR Code ───────────────────────────────────────────────
client.on('qr', (qr) => {
  latestQr = qr;
  console.log('📱 QR جاهز — افتح /qr في المتصفح لمسحه');
});

// ─── جاهز ─────────────────────────────────────────────────
client.on('ready', () => {
  isReady = true;
  latestQr = '';
  console.log('✅ متصل بواتساب!');
});

// ─── انقطع الاتصال ────────────────────────────────────────
client.on('disconnected', () => {
  isReady = false;
  console.log('❌ انقطع الاتصال — جاري إعادة التشغيل...');
  client.initialize();
});

// ══════════════════════════════════════════════════════════
// GET /qr — تفتحه في المتصفح وتمسح الكود بواتساب
// ══════════════════════════════════════════════════════════
app.get('/qr', async (req, res) => {
  if (isReady) return res.send('<h2 style="font-family:sans-serif;color:green">✅ متصل بواتساب بنجاح!</h2>');
  if (!latestQr) return res.send('<h2 style="font-family:sans-serif">⏳ جاري التحضير... حدّث الصفحة بعد 10 ثوانٍ</h2>');
  const url = await qrcode.toDataURL(latestQr);
  res.send(`
    <html dir="rtl">
    <body style="font-family:sans-serif;text-align:center;padding:40px">
      <h2>📱 امسح الكود بواتساب</h2>
      <p style="color:#666">واتساب ← النقاط الثلاث ← الأجهزة المرتبطة ← ربط جهاز</p>
      <img src="${url}" style="width:300px;height:300px" />
      <p style="color:#999;font-size:14px">بعد المسح حدّث الصفحة للتأكد</p>
    </body>
    </html>
  `);
});

// ══════════════════════════════════════════════════════════
// GET / — health check (موقعك يستخدمه للتحقق من الاتصال)
// ══════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.json({
    status: isReady ? 'online' : 'offline',
    service: 'Rakaib WhatsApp Bridge',
    qr_pending: !!latestQr,
  });
});

// ══════════════════════════════════════════════════════════
// POST /send — موقعك يرسل هنا { phone, message }
// ══════════════════════════════════════════════════════════
app.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ ok: false, error: 'مطلوب: phone و message' });
  }

  if (!isReady) {
    return res.status(503).json({ ok: false, error: 'واتساب غير متصل بعد' });
  }

  try {
    // تنظيف الرقم
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('05')) cleaned = '966' + cleaned.slice(1);
    else if (cleaned.startsWith('5')) cleaned = '966' + cleaned;

    const jid = `${cleaned}@c.us`;
    await client.sendMessage(jid, message);
    console.log(`📨 أُرسلت لـ ${cleaned} ✓`);
    res.json({ ok: true, id: `msg-${Date.now()}` });
  } catch (err) {
    console.error('❌ فشل الإرسال:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── تشغيل السيرفر ────────────────────────────────────────
app.listen(port, () => {
  console.log(`🚀 جسر ركايب يعمل على البورت ${port}`);
  client.initialize();
});
