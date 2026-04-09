const express = require('express');
const router = express.Router();
const { analyzeContent } = require('../utils/analysis');

router.post('/', async (req, res, next) => {
  try {
    const { transcript, words = [], type = 'audio', duration = null } = req.body;
    if (!transcript || transcript.trim().length < 50) return res.status(400).json({ error: 'Transcript too short' });
    const result = await analyzeContent({ text: transcript, words, type, totalDuration: duration });
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
