const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const twilio = require('twilio');

const router = express.Router();

const REGION = process.env.AWS_REGION || 'ap-south-1';
const BUCKET = process.env.AWS_S3_BUCKET;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const APP_URL = process.env.APP_URL || 'https://sankkalp.com';

function s3() {
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
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

function videoKey(ref) {
  return `videos/${ref}.mp4`;
}

// Admin: get a presigned URL to upload a video for a booking ref
// PUT the video file directly to the returned URL (Content-Type: video/mp4)
router.post('/admin/video/upload-url/:ref', requireAdmin, async (req, res) => {
  const { ref } = req.params;
  if (!BUCKET) return res.status(500).json({ error: 'S3 bucket not configured' });

  try {
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: videoKey(ref),
      ContentType: 'video/mp4',
    });
    const url = await getSignedUrl(s3(), cmd, { expiresIn: 3600 }); // 1 hour to upload
    res.json({ uploadUrl: url, key: videoKey(ref) });
  } catch (err) {
    console.error('Upload URL error', err);
    res.status(500).json({ error: 'Could not generate upload URL' });
  }
});

// Public: get a short-lived presigned URL to stream the video
router.get('/video/:ref', async (req, res) => {
  const { ref } = req.params;
  if (!BUCKET) return res.status(500).json({ error: 'S3 bucket not configured' });

  try {
    // Verify the video exists before issuing a URL
    await s3().send(new HeadObjectCommand({ Bucket: BUCKET, Key: videoKey(ref) }));

    const cmd = new GetObjectCommand({
      Bucket: BUCKET,
      Key: videoKey(ref),
      ResponseContentDisposition: 'inline',
      ResponseContentType: 'video/mp4',
    });
    const url = await getSignedUrl(s3(), cmd, { expiresIn: 86400 }); // 24 hours
    res.json({ streamUrl: url });
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ error: 'Video not found' });
    }
    console.error('Stream URL error', err);
    res.status(500).json({ error: 'Could not fetch video' });
  }
});

// Admin: send WhatsApp message with video watch link to a phone number
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
