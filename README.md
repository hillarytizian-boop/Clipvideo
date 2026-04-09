# 🎬 ClipCraft AI

Turn podcasts and blog posts into viral TikTok/Reels/Shorts clips using AI.

## Stack
- **Frontend**: React + Vite + TailwindCSS → deploy on Vercel/Netlify
- **Backend**: Node.js + Express + FFmpeg + OpenAI → deploy on Render

---

## Quick Start (Local)

### 1. Clone & setup backend
```bash
cd backend
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm install
npm run dev
```

### 2. Setup frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy to Render (Backend)

1. Push this repo to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo, set root directory to `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variable: `OPENAI_API_KEY=your_key_here`
7. Render auto-installs FFmpeg on its Ubuntu instances

## Deploy Frontend (Vercel)

1. Go to https://vercel.com → New Project
2. Import your GitHub repo, set root directory to `frontend`
3. Add env var: `VITE_API_URL=https://your-render-backend-url.onrender.com/api`
4. Deploy

---

## Features
- Upload MP3/WAV podcast or paste blog URL
- Whisper API transcription with word timestamps
- GPT-4o finds top 3 engaging moments
- FFmpeg generates 9:16 MP4 with animated captions
- Optional logo overlay
- Preview + download clips
