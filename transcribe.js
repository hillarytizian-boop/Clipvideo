const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { transcribeAudio, scrapeBlogUrl } = require('../utils/transcription');

const UPLOAD_DIR = path.join(process.env.TMP_DIR || '/tmp', 'clipcraft-uploads');

router.post('/', async (req, res, next) => {
  try {
    const { fileId, url, type } = req.body;
    if (!fileId && !url) return res.status(400).json({ error: 'Provide fileId or url' });

    if (type === 'url' || url) {
      let targetUrl = url;
      if (!targetUrl && fileId) {
        const meta = JSON.parse(fs.readFileSync(path.join(UPLOAD_DIR, `${fileId}.url.json`), 'utf8'));
        targetUrl = meta.url;
      }
      const result = await scrapeBlogUrl(targetUrl);
      return res.json({ transcript: result.text, title: result.title, type: 'url', words: [], language: 'en', duration: null, segments: [] });
    }

    // Find audio file
    let filePath = null;
    for (const ext of ['.mp3','.wav','.m4a','.ogg','.flac','.mp4','.mov','.webm']) {
      const c = path.join(UPLOAD_DIR, `${fileId}${ext}`);
      if (fs.existsSync(c)) { filePath = c; break; }
    }
    if (!filePath) {
      const f = fs.readdirSync(UPLOAD_DIR).find(f => f.startsWith(fileId));
      if (f) filePath = path.join(UPLOAD_DIR, f);
    }
    if (!filePath) return res.status(404).json({ error: 'File not found' });

    const result = await transcribeAudio(filePath);
    res.json({ transcript: result.text, words: result.words, language: result.language, duration: result.duration, segments: result.segments, type: 'audio' });
  } catch (err) { next(err); }
});

module.exports = router;
