require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

const WAAPI_TOKEN = process.env.WAAPI_TOKEN;
const WAAPI_INSTANCE = process.env.WAAPI_INSTANCE;

app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ status: 'online', service: 'Rakaib WhatsApp Bridge' });
});

app.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ ok: false, error: 'مطلوب phone و message' });
  try {
    let cleaned = phone.replace(/[^\d]/g, '');
    if (cleaned.startsWith('05')) cleaned = '966' + cleaned.slice(1);
    else if (cleaned.startsWith('5')) cleaned = '966' + cleaned;

    const response = await fetch(
      `https://waapi.app/api/v1/instances/${WAAPI_INSTANCE}/client/action/send-message`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WAAPI_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatId: cleaned + '@c.us', message })
      }
    );

    const text = await response.text();
    console.log('WaAPI status:', response.status);
    console.log('WaAPI response:', text);
    if (!response.ok) throw new Error(text || 'WaAPI error');
    console.log('ارسلت ل ' + cleaned);
    res.json({ ok: true });
  } catch (err) {
    console.error('فشل: ' + err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(port, () => console.log('جسر ركايب على البورت ' + port));
