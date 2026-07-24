const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');
const { Readable } = require('stream');

const router = express.Router();

const BUCKET = 'ritual-videos';
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const APP_URL = process.env.APP_URL || 'https://sankkalp.com';

function supabase() {
  return createClient(process.env.VIDEO_SUPABASE_URL, process.env.VIDEO_SUPABASE_SERVICE_KEY);
}

function twilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function requireAdmin(req, res, next) {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function videoPath(ref) {
  return `videos/${ref}.mp4`;
}

async function ensureBucket(sb) {
  const { error } = await sb.storage.createBucket(BUCKET, { public: false });
  // ignore "already exists" error
  if (error && !error.message?.includes('already exists')) throw error;
}

// Admin: get a presigned upload URL for a booking ref
// PUT the video file directly to the returned uploadUrl (Content-Type: video/mp4)
router.post('/admin/video/upload-url/:ref', requireAdmin, async (req, res) => {
  const { ref } = req.params;
  const sb = supabase();
  try {
    await ensureBucket(sb);
    const { data, error } = await sb.storage
      .from(BUCKET)
      .createSignedUploadUrl(videoPath(ref));
    if (error) throw error;
    res.json({ uploadUrl: data.signedUrl, path: data.path });
  } catch (err) {
    console.error('Upload URL error', err);
    res.status(500).json({ error: err.message || 'Could not generate upload URL' });
  }
});

// Public: stream the video proxied through the server (avoids CORS/CSP and slow cold starts)
router.get('/video/:ref', async (req, res) => {
  const { ref } = req.params;
  const sb = supabase();
  try {
    const { data, error } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(videoPath(ref), 3600);
    if (error) return res.status(404).json({ error: 'Video not found' });

    const range = req.headers.range;
    const upstreamHeaders = { 'User-Agent': 'SankalpServer/1.0' };
    if (range) upstreamHeaders['Range'] = range;

    const upstream = await fetch(data.signedUrl, { headers: upstreamHeaders });
    if (!upstream.ok && upstream.status !== 206) {
      return res.status(upstream.status).json({ error: 'Video unavailable' });
    }

    res.status(range ? 206 : 200);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    ['Content-Length', 'Content-Range'].forEach(h => {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    });

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error('Stream error', err);
    if (!res.headersSent) res.status(500).json({ error: 'Could not stream video' });
  }
});

// Admin: send WhatsApp with watch link via Twilio
router.post('/admin/video/send/:ref', requireAdmin, async (req, res) => {
  const { ref } = req.params;
  const { phone, customerName } = req.body;

  if (!phone) return res.status(400).json({ error: 'phone is required' });
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return res.status(500).json({ error: 'Twilio not configured' });
  }

  const watchUrl = `${APP_URL}/watch/${ref}`;
  const name = customerName ? customerName.split(' ')[0] : 'there';
  const body = `Namaste ${name} 🙏\n\nYour ritual video is ready. Watch it here:\n${watchUrl}\n\n— Sankkalp`;

  const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:+91${phone.replace(/\D/g, '').slice(-10)}`;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  try {
    const msg = await twilioClient().messages.create({ body, from, to });
    res.json({ sid: msg.sid, to: msg.to, status: msg.status, watchUrl });
  } catch (err) {
    console.error('Twilio send error', err);
    res.status(500).json({ error: err.message || 'Failed to send WhatsApp message' });
  }
});

module.exports = router;
