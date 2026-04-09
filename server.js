require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const TMP_DIR = process.env.TMP_DIR || '/tmp';

// Ensure temp dirs exist
[path.join(TMP_DIR, 'clipcraft-uploads'), path.join(TMP_DIR, 'clipcraft-clips')].forEach(d =>
  fs.mkdirSync(d, { recursive: true })
);

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'ClipCraft AI' }));

app.use('/api/upload',        require('./routes/upload'));
app.use('/api/transcribe',    require('./routes/transcribe'));
app.use('/api/analyze',       require('./routes/analyze'));
app.use('/api/generate-clip', require('./routes/generateClip'));
app.use('/api/preview',       require('./routes/preview'));

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// Cleanup files older than 1 hour
setInterval(() => {
  ['clipcraft-uploads', 'clipcraft-clips'].forEach(dir => {
    const full = path.join(TMP_DIR, dir);
    if (!fs.existsSync(full)) return;
    fs.readdirSync(full).forEach(f => {
      const fp = path.join(full, f);
      try {
        if (Date.now() - fs.statSync(fp).mtimeMs > 3600000) fs.unlinkSync(fp);
      } catch {}
    });
  });
}, 900000);

app.listen(PORT, () => console.log(`🎬 ClipCraft AI running on port ${PORT}`));
