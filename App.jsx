import { useState } from 'react';
import './index.css';
import Header from './components/Header.jsx';
import UploadZone from './components/UploadZone.jsx';
import ProcessingStatus from './components/ProcessingStatus.jsx';
import ClipCard from './components/ClipCard.jsx';
import { uploadFile, uploadUrl, transcribe, analyze } from './api.js';

export default function App() {
  const [step, setStep] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [clips, setClips] = useState([]);
  const [txData, setTxData] = useState(null);

  const handleUpload = async (input) => {
    setError(null);
    try {
      setStep('uploading');
      const up = input.type === 'file'
        ? await uploadFile(input.file, setProgress)
        : await uploadUrl(input.url);
      setFileId(up.fileId);

      setStep('transcribing');
      const tx = await transcribe({ fileId: up.fileId, url: input.url, type: up.type });
      setTxData(tx);

      setStep('analyzing');
      const result = await analyze({ transcript: tx.transcript, words: tx.words||[], type: up.type, duration: tx.duration });
      setClips(result.clips || []);
      setStep('done');
    } catch (e) {
      setError(e.message);
      setStep('idle');
    }
  };

  const reset = () => { setStep('idle'); setClips([]); setError(null); setFileId(null); setTxData(null); setProgress(0); };

  return (
    <div className="min-h-screen bg-dark-900" style={{backgroundImage:'radial-gradient(ellipse 80% 50% at 20% -10%,rgba(255,31,156,.12) 0%,transparent 60%),radial-gradient(ellipse 60% 60% at 80% 5%,rgba(139,92,246,.1) 0%,transparent 50%)'}}>
      <Header onReset={step !== 'idle' ? reset : null} />
      <main className="max-w-6xl mx-auto px-4 py-12">

        {step === 'idle' && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-xs font-body font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" /> AI-Powered · Free MVP
              </span>
              <h1 className="font-display text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
                Turn Audio into<br />
                <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">Viral Short Clips</span>
              </h1>
              <p className="text-white/40 text-lg max-w-lg mx-auto">Upload a podcast or paste a blog URL — AI finds the best moments and generates 9:16 MP4s with captions.</p>
            </div>
            <UploadZone onSubmit={handleUpload} />
            {error && <div className="mt-5 max-w-xl mx-auto card p-4 border-red-500/30 bg-red-500/5 text-center text-red-400 text-sm">{error}</div>}
            <div className="mt-14 grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {[['01','Upload','Drop an MP3/WAV or paste any blog URL.'],['02','AI Analyzes','Whisper + GPT-4o find top 3 engaging moments.'],['03','Download','Edit timings, add logo, download 9:16 clips.']].map(([n,t,d])=>(
                <div key={n} className="card p-6">
                  <span className="font-mono text-xs text-pink-400">{n}</span>
                  <h3 className="font-display font-semibold text-white mt-2 mb-1">{t}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {['uploading','transcribing','analyzing'].includes(step) && <ProcessingStatus step={step} progress={progress} />}

        {step === 'done' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold text-white">Your Clips Are Ready 🎬</h2>
                <p className="text-white/40 mt-1">AI found {clips.length} high-engagement moments</p>
              </div>
              <button onClick={reset} className="btn-secondary">← New Upload</button>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              {clips.map((clip, i) => <ClipCard key={i} clip={clip} fileId={fileId} words={txData?.words||[]} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
