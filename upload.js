const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(process.env.TMP_DIR || '/tmp', 'clipcraft-uploads');
const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '100');

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`)
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = ['.mp3','.wav','.m4a','.ogg','.flac','.mp4','.mov','.webm'];
    ok.includes(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('Unsupported file type'));
  }
});

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (req.file) {
      const fileId = path.basename(req.file.filename, path.extname(req.file.filename));
      return res.json({ fileId, type: 'file', filename: req.file.filename, size: req.file.size });
    }
    const { url } = req.body;
    if (url) {
      try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
      const fileId = uuidv4();
      fs.writeFileSync(path.join(UPLOAD_DIR, `${fileId}.url.json`), JSON.stringify({ url, fileId }));
      return res.json({ fileId, type: 'url', url });
    }
    res.status(400).json({ error: 'Provide a file or URL' });
  } catch (err) { next(err); }
});

module.exports = router;
