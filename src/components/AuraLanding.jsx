import React from 'react';
import { Play, BarChart2, Scale, Music } from 'lucide-react';

const featureCards = [
  {
    Icon: Scale,
    title: 'Movement Analysis',
    desc: '33-point neural skeleton mapping with sub-pixel joint tracking across every frame.',
    watermark: '33',
  },
  {
    Icon: Music,
    title: 'Cinematic Feedback',
    desc: 'Frame-by-frame critique via Gemini 2.5 Flash — broadcast quality, professional precision.',
    watermark: 'G',
  },
  {
    Icon: BarChart2,
    title: 'Symmetry Evaluation',
    desc: 'Flags asymmetry deltas above 10° across all major joints. Adjudicates with no bias.',
    watermark: '°',
  },
];

export default function AuraLanding({ onStartCapture }) {
  return (
    <div style={{ backgroundColor: 'var(--aura-bg)' }}>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', padding: '8px 22px 4px', overflow: 'hidden', minHeight: '340px' }}>
        {/* Gold glow */}
        <div style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '440px',
          background: 'radial-gradient(ellipse, rgba(255,215,0,0.12), transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Star constellation */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.18, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox="0 0 390 380" preserveAspectRatio="none">
          {Array.from({ length: 26 }).map((_, i) => {
            const x = (i * 53.7) % 390;
            const y = (i * 67.3) % 380;
            return <circle key={i} cx={x} cy={y} r={i % 7 === 0 ? 1.5 : 0.6} fill="#ffe16d" />;
          })}
        </svg>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 500,
            fontSize: 44,
            lineHeight: 1.04,
            margin: '0 0 16px',
            letterSpacing: '0.005em',
            color: 'var(--aura-body)',
          }}>
            Your Stage,<br />
            <span style={{
              fontStyle: 'italic',
              fontWeight: 600,
              color: 'var(--aura-gold)',
              textShadow: '0 0 24px rgba(255,215,0,0.25)',
            }}>
              Your Director.
            </span>
          </h1>

          <p style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--aura-cream)',
            margin: '0 0 22px',
            maxWidth: 320,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Precision analytics meets cinematic storytelling. Capture your mastery with the world's most advanced performance engine.
          </p>

          <button className="btn-gold" onClick={onStartCapture}>
            <Play size={11} /> Begin Performance Capture
          </button>
        </div>
      </section>

      {/* ── Studio Precision ── */}
      <section style={{ padding: '20px 22px 0' }}>
        <div className="section-head" style={{ marginBottom: 22 }}>Studio Precision</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {featureCards.map(({ Icon, title, desc, watermark }) => (
            <div key={title} className="card-feature">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Icon tile */}
                <div style={{
                  width: 36, height: 36, borderRadius: 4, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,225,109,0.08)',
                  border: '1px solid var(--aura-border)',
                  color: 'var(--aura-gold)',
                }}>
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="label-syne" style={{ fontSize: 13, color: 'var(--aura-body)', marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--aura-cream)', fontFamily: 'DM Sans, sans-serif' }}>{desc}</div>
                </div>
              </div>
              {/* Ghost watermark */}
              <div className="card-watermark">{watermark}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 32 }} />
    </div>
  );
}
