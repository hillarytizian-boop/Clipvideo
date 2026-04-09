const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are ClipCraft AI. Analyze content and return the TOP 3 most engaging short-form video moments.
Rules: each clip 30-90s, self-contained, strong hook in first 3 seconds, optimized for TikTok/Reels/Shorts.
Return ONLY valid JSON (no markdown):
{"clips":[{"rank":1,"title":"Short title max 8 words","hook":"Opening line","startTime":0.0,"endTime":45.0,"transcript":"Exact segment text","engagementScore":95,"engagementReason":"Why engaging","suggestedCaption":"Caption #hashtag1 #hashtag2 #hashtag3","clipType":"insight|story|tip|debate|emotional"}]}`;

async function analyzeContent({ text, words = [], type = 'audio', totalDuration = null }) {
  let userContent = `Type: ${type === 'url' ? 'Blog' : 'Podcast'}\n`;
  if (totalDuration) userContent += `Duration: ${Math.round(totalDuration)}s\n`;
  userContent += `\n${text.substring(0, 4000)}`;
  if (words.length > 0) {
    const sample = words.filter((_, i) => i % 10 === 0).map(w => `${w.word}@${w.start.toFixed(1)}s`).join(' ');
    userContent += `\n\nWord timestamps (sample): ${sample}`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1200,
    temperature: 0.7,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }],
    response_format: { type: 'json_object' },
  });

  let parsed;
  try { parsed = JSON.parse(response.choices[0].message.content); }
  catch { const m = response.choices[0].message.content.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { clips: [] }; }

  const clips = (parsed.clips || []).slice(0, 3);

  if (words.length > 0) {
    clips.forEach(clip => {
      const sw = words.find(w => w.start >= clip.startTime - 1);
      const ew = [...words].reverse().find(w => w.end <= clip.endTime + 1);
      if (sw) clip.startTime = Math.max(0, sw.start - 0.3);
      if (ew) clip.endTime = ew.end + 0.3;
      const seg = words.filter(w => w.start >= clip.startTime && w.end <= clip.endTime + 0.5);
      if (seg.length) { clip.transcript = seg.map(w => w.word).join(' '); clip.words = seg; }
    });
  }

  return { clips, tokensUsed: response.usage?.total_tokens || 0 };
}

module.exports = { analyzeContent };
