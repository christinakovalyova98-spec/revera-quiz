// Vercel serverless function: sends a quiz lead to Telegram.
// Env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
// Without them the function skips sending and still answers 200, so the user never sees an error.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function line(label, value) {
  if (value === undefined || value === null || value === '') return '';
  const v = Array.isArray(value) ? value.join(', ') : String(value);
  return `${label}: ${v}\n`;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = await readBody(req);

  // Honeypot: bots fill the hidden "website" field. Pretend success.
  if (body.website) return res.status(200).json({ ok: true });

  const email = String(body.email || '').trim().slice(0, 200);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'Invalid email' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(200).json({ ok: true, skipped: true });

  const a = body.answers || {};
  const when = body.completedAt ? new Date(body.completedAt) : new Date();
  const text =
    'New quiz lead: menopause training\n\n' +
    line('Email', email) +
    line('Marketing opt-in', body.optin ? 'yes' : 'no') +
    '\nAnswers\n' +
    line('1. Age', a.age) +
    line('2. Stage', a.stage) +
    line('3. What brought her', a.reason) +
    line('4. Activity now', a.activity) +
    line('5. Body shape', a.shape) +
    line('6. Zones', a.zones) +
    line('7. Past 3 months', a.recent) +
    line('8. Time belief', a.time) +
    line('9. Barriers', a.barriers) +
    line('10. Wants more of', a.desires) +
    '\nResult\n' +
    line('Score', body.score !== undefined ? `${body.score}/100` : '') +
    line('Zone', body.zone) +
    line('Type', body.type) +
    line('Strength', body.strength) +
    line('Holding her back', body.weakness) +
    line('First step', body.firstStep) +
    line('Completed', `${when.toISOString().replace('T', ' ').slice(0, 16)} UTC` + (body.tz ? ` (user tz: ${body.tz})` : ''));

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true }),
    });
    if (!r.ok) return res.status(200).json({ ok: true, delivered: false });
    return res.status(200).json({ ok: true, delivered: true });
  } catch (e) {
    return res.status(200).json({ ok: true, delivered: false });
  }
};
