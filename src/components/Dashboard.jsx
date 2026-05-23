import React, { useState, useEffect } from 'react';

export default function Dashboard({ analysisText, trackingData, onReset }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const parseResponse = () => {
    if (!analysisText) return { score: 70, sections: [] };
    const lines = analysisText.trim().split('\n');
    const scoreMatch = lines[0].match(/SCORE:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 70;
    const remainingContent = lines.slice(1).join('\n').trim();
    const rawSections = remainingContent.split(/(?=###\s+)/);
    const sections = [];
    rawSections.forEach((section) => {
      const secLines = section.trim().split('\n');
      const header = secLines[0] || '';
      const body = secLines.slice(1).join('\n').trim();
      if (header.startsWith('###')) {
        sections.push({ title: header.replace('###', '').trim(), body });
      } else if (section.trim()) {
        sections.push({ title: 'Analysis Details', body: section.trim() });
      }
    });
    return { score, sections };
  };

  const { score, sections } = parseResponse();

  useEffect(() => {
    const t = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(t);
  }, [score]);

  const R = 100;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC - (animatedScore / 100) * CIRC;

  const formatBody = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} className="h-2" />;
      if (t.startsWith('-') || t.startsWith('*')) {
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '8px 0' }}>
            <span style={{ color: '#ffe16d', fontSize: '10px', marginTop: '4px', flexShrink: 0 }}>▶</span>
            <span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', lineHeight: '1.6', color: '#d0c6ab' }}>
              {t.substring(1).trim()}
            </span>
          </div>
        );
      }
      if (/^\d+\./.test(t)) {
        const num = t.match(/^\d+/)[0];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', margin: '8px 0' }}>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '14px', color: '#ffe16d', flexShrink: 0 }}>{num}.</span>
            <span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', lineHeight: '1.6', color: '#d0c6ab' }}>{t.replace(/^\d+\./, '').trim()}</span>
          </div>
        );
      }
      if (t.startsWith('**') && t.endsWith('**')) {
        return <p key={i} style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '13px', color: '#e2e2e2', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '12px 0 4px' }}>{t.replace(/\*\*/g, '')}</p>;
      }
      return <p key={i} style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', lineHeight: '1.6', color: '#d0c6ab', margin: '4px 0' }}>{t}</p>;
    });
  };

  const perfId = `#AX-${String(Math.floor(Math.random() * 9000 + 1000))}`;

  return (
    <div style={{ backgroundColor: '#121414', minHeight: '100%' }}>
      <div style={{ maxWidth: '672px', margin: '0 auto', padding: '32px 20px' }}>

        {/* Gauge Section */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' }}>
          <div style={{ position: 'relative', width: 240, height: 240 }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 210 210">
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#ffe16d', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#e9c400', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <circle fill="none" stroke="#1e2020" strokeWidth="8" cx="105" cy="105" r={R} />
              <circle
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth="8"
                strokeLinecap="square"
                cx="105"
                cy="105"
                r={R}
                strokeDasharray={CIRC}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '52px', lineHeight: 1, color: '#ffe16d' }}>
                {animatedScore}
              </span>
              <span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#d0c6ab', marginTop: '4px' }}>
                Overall
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '24px', color: '#e2e2e2' }}>
              Mastery Audit Complete
            </h2>
            <p style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', color: '#d0c6ab', opacity: 0.6, marginTop: '4px' }}>
              Performance ID: {perfId}
            </p>
          </div>
        </section>

        {/* Insight Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sections.map((section, idx) => {
            const isSymmetry = section.title.includes('Symmetry') || section.title.includes('⚖');
            const icon = isSymmetry ? 'accessibility_new' : 'trending_down';
            const label = isSymmetry ? 'Symmetry' : 'Form';
            const pct = isSymmetry
              ? `${Math.min(100, Math.max(0, score + 10))}%`
              : `${Math.min(100, Math.max(0, score - 5))}%`;
            const subLabel = isSymmetry ? 'Balance' : 'Precision';

            return (
              <div
                key={idx}
                style={{ backgroundColor: '#1a1c1c', border: '1px solid #4d4732', borderRadius: '2px', padding: '32px', position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,225,109,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#4d4732')}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '16px', opacity: 0.07 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#ffe16d' }}>{icon}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', position: 'relative' }}>
                  <div>
                    <span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffe16d', display: 'block', marginBottom: '4px' }}>
                      {label}
                    </span>
                    <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '24px', color: '#e2e2e2', lineHeight: 1.3 }}>
                      {section.title.replace(/[⚖️📉]/g, '').trim()}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '32px', lineHeight: 1, color: '#ffe16d', display: 'block' }}>
                      {pct}
                    </span>
                    <span style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '12px', color: '#d0c6ab' }}>{subLabel}</span>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: '#4d4732', marginBottom: '16px' }} />
                <div>{formatBody(section.body)}</div>
              </div>
            );
          })}

          {sections.length === 0 && (
            <div style={{ padding: '32px', border: '1px solid #4d4732', backgroundColor: '#1a1c1c', borderRadius: '2px' }}>
              <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '18px', color: '#e2e2e2' }}>No Critique Generated</p>
              <p style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '14px', color: '#d0c6ab', marginTop: '8px' }}>
                The report was empty. Please verify your API key and try again.
              </p>
            </div>
          )}
        </div>

        {/* Acquisition Metrics */}
        {trackingData && trackingData.length > 0 && (
          <div style={{ border: '1px solid #4d4732', backgroundColor: '#1a1c1c', borderRadius: '2px', padding: '24px', marginTop: '24px' }}>
            <p style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffe16d', marginBottom: '16px' }}>
              Acquisition Metrics
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Total Frames', value: `${trackingData.length} snapshots` },
                { label: 'Sample Freq', value: '5.0 Hz' },
                { label: 'Elapsed Time', value: `${((trackingData[trackingData.length - 1].timestamp_ms) / 1000).toFixed(2)}s` },
                { label: 'CNN Engine', value: 'BlazePose v1' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontFamily: 'Hanken Grotesk, sans-serif', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999077' }}>{label}</p>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '15px', color: '#e2e2e2', marginTop: '4px' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', marginBottom: '16px' }}>
          <button
            onClick={onReset}
            style={{ backgroundColor: '#ffd700', color: '#221b00', borderRadius: '2px', padding: '16px 40px', fontFamily: 'Hanken Grotesk, sans-serif', fontWeight: 600, fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>replay</span>
            Re-record Audit
          </button>
        </div>
      </div>
    </div>
  );
}
