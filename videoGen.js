const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const CLIPS_DIR = path.join(process.env.TMP_DIR || '/tmp', 'clipcraft-clips');

function isAudio(fp) { return ['.mp3','.wav','.m4a','.ogg','.flac','.aac'].includes(path.extname(fp).toLowerCase()); }

function assTime(s) {
  if (s < 0) s = 0;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), cs = Math.round((s % 1) * 100);
  return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}

function buildASS(words, clipStart) {
  const header = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Default,Arial,58,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,20,20,300,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const lines = [];
  const G = 5;
  for (let i = 0; i < words.length; i += G) {
    const group = words.slice(i, i + G);
    group.forEach((aw, j) => {
      const ws = aw.start - clipStart, we = aw.end - clipStart;
      if (ws < 0) return;
      const parts = group.map((w, k) =>
        k === j ? `{\\c&H00FFFF&\\b1}${w.word}{\\c&H00FFFFFF&\\b0}` : `{\\c&H00FFFFFF&}${w.word}`
      );
      lines.push(`Dialogue: 0,${assTime(ws)},${assTime(we)},Default,,0,0,0,,${parts.join(' ')}`);
    });
  }
  return header + lines.join('\n');
}

function esc(t) { return t.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/:/g,'\\:').replace(/\n/g,' '); }

async function generateClip({ inputPath, outputId, startTime = 0, endTime, words = [], captionText = '', logoPath = null, bgColor = '0a0a0a', title = '' }) {
  const duration = endTime - startTime;
  if (duration <= 0) throw new Error('Invalid duration');
  const outputPath = path.join(CLIPS_DIR, `${outputId}.mp4`);
  const audio = isAudio(inputPath);

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();
    cmd.input(inputPath).inputOptions([`-ss ${startTime}`, `-t ${duration}`]);

    const filters = [];
    if (audio) {
      cmd.input(`color=c=#${bgColor}:s=1080x1920:r=30`).inputOptions(['-f lavfi']);
      filters.push(`[1:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=#${bgColor}[base]`);
    } else {
      filters.push(`[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[base]`);
    }

    let last = '[base]';

    if (title) {
      filters.push(`${last}drawtext=text='${esc(title.substring(0,50))}':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=120:box=1:boxcolor=black@0.6:boxborderw=15[titled]`);
      last = '[titled]';
    }

    if (words.length > 0) {
      const assPath = path.join(CLIPS_DIR, `${outputId}.ass`);
      fs.writeFileSync(assPath, buildASS(words, startTime));
      filters.push(`${last}subtitles='${assPath}'[captioned]`);
      last = '[captioned]';
    } else if (captionText) {
      filters.push(`${last}drawtext=text='${esc(captionText.substring(0,120))}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-280:box=1:boxcolor=black@0.7:boxborderw=18[captioned]`);
      last = '[captioned]';
    }

    if (logoPath && fs.existsSync(logoPath)) {
      cmd.input(logoPath);
      const li = audio ? 2 : 1;
      filters.push(`[${li}:v]scale=160:160[logo]`, `${last}[logo]overlay=W-iw-30:30[withlogo]`);
      last = '[withlogo]';
    }

    if (filters.length > 0) cmd.complexFilter(filters, last);

    cmd.outputOptions(['-c:v libx264','-preset fast','-crf 23','-c:a aac','-b:a 128k','-pix_fmt yuv420p','-movflags +faststart','-r 30'])
      .output(outputPath)
      .on('end', () => {
        const ass = path.join(CLIPS_DIR, `${outputId}.ass`);
        if (fs.existsSync(ass)) fs.unlinkSync(ass);
        resolve(outputPath);
      })
      .on('error', err => reject(new Error(`FFmpeg: ${err.message}`)))
      .run();
  });
}

function getMediaDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, meta) => err ? reject(err) : resolve(meta.format.duration || 0));
  });
}

module.exports = { generateClip, getMediaDuration };
