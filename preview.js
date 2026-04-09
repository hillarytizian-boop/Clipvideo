const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const CLIPS_DIR = path.join(process.env.TMP_DIR || '/tmp', 'clipcraft-clips');

router.get('/:clipId', (req, res) => {
  const filePath = path.join(CLIPS_DIR, `${req.params.clipId}.mp4`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Clip not found or expired' });

  const stat = fs.statSync(filePath);
  const range = req.headers.range;
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Accept-Ranges', 'bytes');

  if (range) {
    const [s, e] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(s, 10);
    const end = e ? parseInt(e, 10) : stat.size - 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', end - start + 1);
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(filePath).pipe(res);
  }
});

router.get('/:clipId/download', (req, res) => {
  const filePath = path.join(CLIPS_DIR, `${req.params.clipId}.mp4`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Clip not found' });
  res.setHeader('Content-Disposition', `attachment; filename="clip-${req.params.clipId.slice(0,8)}.mp4"`);
  res.setHeader('Content-Type', 'video/mp4');
  fs.createReadStream(filePath).pipe(res);
});

router.get('/:clipId/status', (req, res) => {
  const filePath = path.join(CLIPS_DIR, `${req.params.clipId}.mp4`);
  const exists = fs.existsSync(filePath);
  res.json({ exists, size: exists ? fs.statSync(filePath).size : 0 });
});

module.exports = router;
