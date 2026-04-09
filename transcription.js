const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });
  return {
    text: response.text,
    words: (response.words || []).map(w => ({ word: w.word, start: w.start, end: w.end })),
    language: response.language || 'en',
    duration: response.duration || null,
    segments: (response.segments || []).map(s => ({ id: s.id, start: s.start, end: s.end, text: s.text })),
  };
}

async function scrapeBlogUrl(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 ClipCraftBot/1.0' }, timeout: 15000 });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $('nav,footer,script,style,aside').remove();
  const title = $('h1').first().text().trim() || $('title').text().trim() || 'Article';
  let text = '';
  for (const sel of ['article','main','.post-content','.entry-content','body']) {
    text = $(sel).text().replace(/\s+/g, ' ').trim();
    if (text.length > 300) break;
  }
  return { text: text.substring(0, 6000), title, url };
}

module.exports = { transcribeAudio, scrapeBlogUrl };
