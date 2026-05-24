import React, { useState, useEffect } from 'react';
import { RefreshCw, Award, Activity, ShieldAlert, Heart, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';

export default function Dashboard({ analysisText, trackingData, onReset, isUploadedVideo = false }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [viewMode, setViewMode] = useState('condensed');

  // Parse the LLM response to extract the score and markdown content
  const parseResponse = () => {
    if (!analysisText) return { score: 70, sections: [] };

    const lines = analysisText.trim().split('\n');

    // Regex to match "SCORE: [number]/100" anywhere in the response text
    const scoreMatch = analysisText.match(/SCORE:\s*(\d+)/i);
    let score = scoreMatch ? parseInt(scoreMatch[1], 10) : 70;

    if (isUploadedVideo) {
      // Buff uploaded video scores by 1.2x and clamp (never under 50, never over 95)
      score = Math.max(50, Math.min(95, Math.round(score * 1.2)));
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
    if (s >= 85) return { label: 'ELITE FORM',      color: 'var(--aura-gold)',    icon: ShieldCheck };
    if (s >= 70) return { label: 'STRONG STANDING', color: 'var(--aura-cyan)',    icon: Award };
    if (s >= 55) return { label: 'BUILDING POISE',  color: 'var(--aura-amber)',   icon: Activity };
    return            { label: 'NEEDS REFINEMENT', color: 'var(--aura-rose)',    icon: ShieldAlert };
  };

  const rating = getRating(score);
  const RatingIcon = rating.icon;

  // SVG Circle calculations (168px viewbox)
  const radius = 75;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Custom markdown body formatter
  const formatBodyText = (text) => {
    if (!text) return null;

    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: '6px' }} />;

      // Bullet points
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const content = trimmed.substring(1).trim();
        return (
          <div key={idx} style={{ display: 'flex', gap: '10px', margin: '8px 0', paddingLeft: '4px' }}>
            <ChevronRight size={14} style={{ color: 'var(--aura-gold)', flexShrink: 0, marginTop: '3px' }} />
            <span style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--aura-cream)', lineHeight: 1.7 }}>{content}</span>
          </div>
        );
      }

      // Ordered lists (numbers)
      if (/^\d+\./.test(trimmed)) {
        const content = trimmed.replace(/^\d+\./, '').trim();
        const number = trimmed.match(/^\d+/)[0];
        return (
          <div key={idx} style={{ display: 'flex', gap: '10px', margin: '8px 0', paddingLeft: '4px' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', color: 'var(--aura-gold)', flexShrink: 0, minWidth: '16px' }}>{number}.</span>
            <span style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--aura-cream)', lineHeight: 1.7 }}>{content}</span>
          </div>
        );
      }

      // Headers inside body
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={idx} className="eyebrow" style={{ margin: '14px 0 6px' }}>
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }

      // Default paragraph
      return (
        <p key={idx} style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--aura-cream)', lineHeight: 1.7, margin: '6px 0' }}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div style={{ padding: '18px 18px 24px' }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Audit Report Completed</div>
          <div className="h-title" style={{ fontSize: 22, letterSpacing: '0.04em' }}>Form Analytics</div>
        </div>
        <button className="btn-ghost" style={{ padding: '8px 12px', fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }} onClick={onReset}>
          <RefreshCw size={11} /> New
        </button>
      </div>

      {/* ScoreRing */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <div style={{ position: 'relative', width: 160, height: 160 }}>
          <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffe16d" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r={radius} stroke="rgba(255,225,109,0.08)" strokeWidth={strokeWidth} fill="transparent" />
            <circle cx="80" cy="80" r={radius} stroke="url(#goldRing)" strokeWidth={strokeWidth} fill="transparent"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 52, color: 'var(--aura-body)', lineHeight: 1, position: 'relative', top: '-4px' }}>{animatedScore}</span>
          </div>
        </div>
      </div>

      {/* Rating pill — dynamic color */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <span className="pill" style={{ color: rating.color, borderColor: `${rating.color}55` }}>
          <RatingIcon size={10} /> {rating.label}
        </span>
      </div>

      {/* Score card */}
      <div className="card" style={{ padding: '22px 18px', marginBottom: 16, background: 'radial-gradient(ellipse at top, rgba(255,225,109,0.06), var(--aura-card) 65%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { v: trackingData?.length ? `${trackingData.length}` : '—', l: 'Checkpoints' },
            { v: 'High', l: 'Precision' },
            { v: trackingData?.length ? `${((trackingData[trackingData.length - 1].timestamp_ms) / 1000).toFixed(1)}s` : '—', l: 'Duration' },
            { v: 'AI', l: 'Pose' },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: 'var(--aura-body)' }}>{m.v}</div>
              <div className="eyebrow-muted" style={{ fontSize: 8, marginTop: 2 }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="seg" style={{ marginBottom: 14 }}>
        <button className={viewMode === 'condensed' ? 'active' : ''} onClick={() => setViewMode('condensed')}>Condensed</button>
        <button className={viewMode === 'elaborated' ? 'active' : ''} onClick={() => setViewMode('elaborated')}>Elaborated</button>
      </div>

      {/* Critique cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sections.map((section, idx) => {
          const isSymmetry = section.title.includes('Symmetry');
          const c = isSymmetry ? 'var(--aura-cyan)' : 'var(--aura-emerald)';
          const content = viewMode === 'condensed' ? section.condensed : section.elaborated;
          return (
            <div key={idx} style={{
              background: 'var(--aura-card)',
              border: '1px solid var(--aura-border-soft)',
              borderLeft: `3px solid ${c}`,
              borderRadius: 4,
              padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: c }}>
                <div className="label-syne" style={{ fontSize: 12, color: 'var(--aura-body)' }}>{section.title.replace('⚖️', '').replace('📉', '').trim()}</div>
              </div>
              <div style={{ fontFamily: 'DM Sans', fontSize: '13px', lineHeight: 1.7, color: 'var(--aura-cream)' }}>
                {formatBodyText(content)}
              </div>
            </div>
          );
        })}

        {sections.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            <div className="h-title" style={{ fontSize: 18, marginBottom: 8 }}>No Report</div>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--aura-muted)', margin: 0 }}>Analysis could not be parsed. Check your API key and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
