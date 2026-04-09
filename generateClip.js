const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { generateClip } = require('../utils/videoGen');

const UPLOAD_DIR = path.join(process.env.TMP_DIR || '/tmp', 'clipcraft-uploads');
const CLIPS_DIR  = path.join(process.env.TMP_DIR || '/tmp', 'clipcraft-clips');
const logoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } }).single('logo');

router.post('/', (req, res, next) => {
  logoUpload(req, res, async (err) => {
    if (err) return next(err);
    try {
      const { fileId, startTime, endTime, words, captionText = '', title = '', bgColor = '0a0a0a', fontColor = 'white' } = req.body;
      const start = parseFloat(startTime);
      const end   = parseFloat(endTime);
      const parsedWords = words ? (typeof words === 'string' ? JSON.parse(words) : words) : [];

      if (!fileId) return res.status(400).json({ error: 'fileId required' });
      if (isNaN(start) || isNaN(end)) return res.status(400).json({ error: 'startTime and endTime required' });

      let inputPath = null;
      for (const ext of ['.mp3','.wav','.m4a','.ogg','.flac','.mp4','.mov','.webm']) {
        const c = path.join(UPLOAD_DIR, `${fileId}${ext}`);
        if (fs.existsSync(c)) { inputPath = c; break; }
      }
      if (!inputPath) {
        const f = fs.readdirSync(UPLOAD_DIR).find(f => f.startsWith(fileId));
        if (f) inputPath = path.join(UPLOAD_DIR, f);
      }
      if (!inputPath) return res.status(404).json({ error: 'Source file not found' });

      let logoPath = null;
      if (req.file) {
        logoPath = path.join(CLIPS_DIR, `logo-${uuidv4()}.png`);
        fs.writeFileSync(logoPath, req.file.buffer);
      }

      const clipId = uuidv4();
      const outputPath = await generateClip({ inputPath, outputId: clipId, startTime: start, endTime: end, words: parsedWords, captionText, logoPath, bgColor, fontColor, title });
      if (logoPath && fs.existsSync(logoPath)) fs.unlinkSync(logoPath);

      const stat = fs.statSync(outputPath);
      res.json({ clipId, filename: `${clipId}.mp4`, size: stat.size, duration: end - start });
    } catch (err) { next(err); }
  });
});

module.exports = router;
