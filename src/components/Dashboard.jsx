import React, { useState, useEffect } from 'react';
import { RefreshCw, Award, Activity, ShieldAlert, Heart, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';

export default function Dashboard({ analysisText, trackingData, onReset, isUploadedVideo = false }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [viewMode, setViewMode] = useState('condensed');

  // Parse the LLM response to extract the score and markdown content
  const parseResponse = () => {
    if (!analysisText) return { score: 70, sections: [] };

    const lines = analysisText.trim().split('\n');
    const firstLine = lines[0];

    // Regex to match "SCORE: [number]/100" or similar
    const scoreMatch = firstLine.match(/SCORE:\s*(\d+)/i);
    let score = scoreMatch ? parseInt(scoreMatch[1], 10) : 70;

    if (isUploadedVideo) {
      // Buff and clamp scores for uploaded videos (never under 50, never over 95)
      score = Math.max(50, Math.min(95, score));
    }

    // Remaining content excluding the first line
    const remainingContent = lines.slice(1).join('\n').trim();

    // Split remaining content by headers: "### ⚖️ Symmetry & Balance" and "### 📉 Form Corrections"
    // Using positive lookahead to keep headers
    const rawSections = remainingContent.split(/(?=###\s+)/);
    const sections = [];

    rawSections.forEach((section) => {
      const secLines = section.trim().split('\n');
      const header = secLines[0] || '';
      const body = secLines.slice(1).join('\n').trim();

      if (header.startsWith('###')) {
        const title = header.replace('###', '').trim();
        // Split by === CONDENSED === separator
        const parts = body.split(/===\s*CONDENSED\s*===/i);
        const elaborated = (parts[0] || '').trim();
        const condensed = (parts[1] || elaborated).trim();
        sections.push({ title, elaborated, condensed });
      } else if (section.trim()) {
        // Fallback for body content without a specific header
        sections.push({ title: '📋 Analysis Details', elaborated: section.trim(), condensed: section.trim() });
      }
    });

    return { score, sections };
  };

  const { score, sections } = parseResponse();

  // Trigger score circle animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 150);
    return () => clearTimeout(timer);
  }, [score]);

  // Calculate qualitative rating
  const getRating = (s) => {
    if (s >= 90) return { label: 'EXCELLENT FORM', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: ShieldCheck };
    if (s >= 75) return { label: 'STRONG STANDING', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10', icon: Award };
    if (s >= 60) return { label: 'MINOR VARIATIONS', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: Activity };
    return { label: 'NEEDS CORRECTION', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10', icon: ShieldAlert };
  };

  const rating = getRating(score);
  const RatingIcon = rating.icon;

  // SVG Circle calculations
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Custom markdown body formatter
  const formatBodyText = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Bullet points
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const content = trimmed.substring(1).trim();
        return (
          <div key={idx} className="flex items-start gap-2.5 my-2.5 text-slate-300 text-sm pl-2">
            <ChevronRight className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>{content}</span>
          </div>
        );
      }

      // Ordered lists (numbers)
      if (/^\d+\./.test(trimmed)) {
        const content = trimmed.replace(/^\d+\./, '').trim();
        const number = trimmed.match(/^\d+/)[0];
        return (
          <div key={idx} className="flex items-start gap-3 my-2.5 text-slate-300 text-sm pl-2">
            <span className="font-orbitron font-bold text-emerald-400 shrink-0 min-w-[16px] text-right">{number}.</span>
            <span>{content}</span>
          </div>
        );
      }

      // Headers inside body
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <h4 key={idx} className="text-slate-200 font-bold text-sm mt-4 mb-2 uppercase tracking-wide">
            {trimmed.replace(/\*\*/g, '')}
          </h4>
        );
      }

      // Default paragraph
      return (
        <p key={idx} className="text-slate-300 text-sm leading-relaxed my-2 text-justify">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="text-xs font-orbitron font-semibold tracking-widest text-cyan-400 uppercase mb-1">
            Audit Report Completed
          </div>
          <h1 className="text-3xl font-orbitron font-black text-slate-100 tracking-tight glow-cyan">
            BIOFORM ANALYTICS
          </h1>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 border border-cyan-400 text-slate-950 font-orbitron font-bold tracking-wider rounded-xl transition-all duration-300 active:scale-95 hover:shadow-cyan-500/20 shadow-lg"
        >
          <RefreshCw className="h-4 w-4" />
          RECORD NEW TEST
        </button>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: Circular Score Card (Columns 1-4) */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
          <div className="glassmorphism rounded-2xl border border-slate-800 p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
            {/* Visual gradient accent */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />

            <span className="text-xs font-orbitron font-bold text-slate-400 tracking-widest uppercase mb-6">
              BIOMECHANICAL PERFORMANCE
            </span>

            {/* Circular Ring SVG */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
                    <stop offset="100%" stopColor="#10b981" /> {/* Emerald */}
                  </linearGradient>
                </defs>
                {/* Track circle */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  className="stroke-slate-800/80"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r={radius}
                  stroke="url(#scoreGrad)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Score text overlay */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-orbitron font-black text-slate-50 tracking-tighter">
                  {animatedScore}
                </span>
                <span className="text-xs font-orbitron text-slate-400 tracking-wider mt-1">
                  OF 100 PTS
                </span>
              </div>
            </div>

            {/* Rating Badge */}
            <div className={`mt-6 px-4 py-2 border rounded-full font-orbitron font-bold text-xs tracking-wider flex items-center gap-1.5 ${rating.color}`}>
              <RatingIcon className="h-4 w-4 shrink-0" />
              {rating.label}
            </div>
          </div>

          {/* Slicing statistics */}
          {trackingData && trackingData.length > 0 && (
            <div className="glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col gap-3 shadow-lg">
              <h3 className="text-xs font-orbitron font-bold text-slate-300 tracking-wider uppercase border-b border-slate-800 pb-2">
                ACQUISITION METRICS
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-orbitron">
                <div>
                  <div className="text-slate-500">TRACKED MOMENTS</div>
                  <div className="text-base font-bold text-slate-200">{trackingData.length} checkpoints</div>
                </div>
                <div>
                  <div className="text-slate-500">CAPTURE STABILITY</div>
                  <div className="text-base font-bold text-slate-200">High Precision</div>
                </div>
                <div>
                  <div className="text-slate-500">DURATION</div>
                  <div className="text-base font-bold text-slate-200">
                    {((trackingData[trackingData.length - 1].timestamp_ms) / 1000).toFixed(1)}s
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">ANALYSIS ENGINE</div>
                  <div className="text-base font-bold text-slate-200">BioForm Pose AI</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Critique Cards (Columns 5-12) */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6 w-full">
          {/* View Mode Toggle Switch */}
          <div className="flex justify-between items-center bg-slate-900/30 border border-slate-800 rounded-xl p-3">
            <span className="text-xs font-orbitron font-semibold text-slate-400 tracking-wider">REPORT DETAIL:</span>
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-1">
              <button
                onClick={() => setViewMode('condensed')}
                className={`px-4 py-1.5 rounded text-xs font-orbitron font-bold tracking-wider transition-all duration-300 ${
                  viewMode === 'condensed'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                CONDENSED
              </button>
              <button
                onClick={() => setViewMode('elaborated')}
                className={`px-4 py-1.5 rounded text-xs font-orbitron font-bold tracking-wider transition-all duration-300 ${
                  viewMode === 'elaborated'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ELABORATED
              </button>
            </div>
          </div>

          {sections.map((section, idx) => {
            // Apply border highlight depending on heading icon
            const isSymmetry = section.title.includes('Symmetry');
            const cardAccentColor = isSymmetry ? 'border-cyan-500/20 focus-within:border-cyan-400' : 'border-emerald-500/20 focus-within:border-emerald-400';
            const iconBg = isSymmetry ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

            return (
              <div
                key={idx}
                className={`glassmorphism rounded-2xl border ${cardAccentColor} p-6 shadow-2xl transition-all duration-300 hover:translate-y-[-2px]`}
              >
                {/* Header title */}
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
                  <div className={`p-2 rounded-lg border text-sm font-bold ${iconBg}`}>
                    {isSymmetry ? '⚖️' : '📉'}
                  </div>
                  <h3 className="font-orbitron font-bold text-lg text-slate-100 tracking-wide uppercase">
                    {section.title}
                  </h3>
                </div>

                {/* Formatted Text */}
                <div className="space-y-1 font-sans">
                  {formatBodyText(viewMode === 'condensed' ? section.condensed : section.elaborated)}
                </div>
              </div>
            );
          })}

          {sections.length === 0 && (
            <div className="glassmorphism rounded-2xl border border-slate-800 p-8 text-center text-slate-400">
              <p className="font-semibold text-lg text-slate-200 mb-2">No Critique Generated</p>
              <p className="text-sm">The biomechanical judging report failed to parse or was empty. Please check your model or API settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
