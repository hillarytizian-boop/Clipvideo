const BASE = import.meta.env.VITE_API_URL || '/api';

async function req(url, opts = {}) {
  const r = await fetch(BASE + url, opts);
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || `HTTP ${r.status}`); }
  return r;
}

export async function uploadFile(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData(); fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', BASE + '/upload');
    xhr.upload.onprogress = e => e.lengthComputable && onProgress?.(Math.round(e.loaded/e.total*100));
    xhr.onload = () => xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed'));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(fd);
  });
}

export async function uploadUrl(url) { return (await req('/upload', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url }) })).json(); }
export async function transcribe(body) { return (await req('/transcribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })).json(); }
export async function analyze(body)    { return (await req('/analyze',    { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })).json(); }

export async function generateClip({ fileId, startTime, endTime, words, captionText, title, logoFile }) {
  const fd = new FormData();
  fd.append('fileId', fileId); fd.append('startTime', startTime); fd.append('endTime', endTime);
  fd.append('captionText', captionText||''); fd.append('title', title||'');
  if (words?.length) fd.append('words', JSON.stringify(words));
  if (logoFile) fd.append('logo', logoFile);
  return (await req('/generate-clip', { method:'POST', body: fd })).json();
}

export const getPreviewUrl  = id => `${BASE}/preview/${id}`;
export const getDownloadUrl = id => `${BASE}/preview/${id}/download`;
