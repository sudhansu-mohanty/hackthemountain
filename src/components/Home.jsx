import React, { useState } from 'react';
import { 
  Play, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Zap, 
  Volume2, 
  Compass, 
  Users, 
  Award,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2
} from 'lucide-react';

export default function Home({ onNavigate }) {
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setSubmitted(true);
    setFeedback('Success! Your sandbox profile is queued. Instant access link dispatched.');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* ── SECTION 1: HERO ZONE ── */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 'auto', maxWidth: '640px', margin: '3.2% auto 0', gap: '12px' }}>
        
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, color: 'var(--aura-body)', lineHeight: 1.1, margin: 0, textShadow: '0 0 24px rgba(255,225,109,0.05)', textAlign: 'center' }}>
          <span style={{ fontSize: '38px', opacity: 0.85, display: 'block', marginBottom: '8px' }}>The Studio is Closed.</span>
          <span style={{ fontSize: '46px', color: 'var(--aura-gold)', textShadow: '0 0 16px rgba(255,215,0,0.2)', display: 'block', lineHeight: 1.0 }}>But Stage is Yours.</span>
        </h1>
        
        <p style={{ fontFamily: 'DM Sans', fontSize: '13px', color: 'var(--aura-cream)', lineHeight: 1.7, margin: 0, textAlign: 'center' }}>
          Private coaching has been a luxury, and elite studio space remains limited. Scénix dismantles these traditional gatekeepers. Upload your dance and vocal tracks to receive instant, high precision AI biomechanical feedback and authentic community validation on a platform built for Art.
        </p>
      </section>

      {/* ── SECTION 3: THE CO-OPERATIVE JUDGING ECOSYSTEM ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', background: 'var(--aura-card-2)', borderRadius: '24px', border: '1px solid var(--aura-border-soft)', padding: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="eyebrow-muted">THE HUMAN + ALGORITHMIC SYNERGY</span>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', fontWeight: 500, color: 'var(--aura-body)', margin: 0 }}>
            The Co-Operative Judging Ecosystem
          </h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: '12px', color: 'var(--aura-muted)', margin: 0 }}>
            Establishing trust by balancing algorithmic speed with peer artistic soul.
          </p>
        </div>

        {/* Dynamic workflow roadmap */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', position: 'relative' }} className="grid-responsive-3col">
          {/* Line connector */}
          <div className="workflow-connector" style={{ position: 'absolute', top: '24px', left: '10%', width: '80%', height: '1px', background: 'linear-gradient(90deg, var(--aura-gold) 0%, var(--aura-cyan) 50%, var(--aura-emerald) 100%)', opacity: 0.15, zIndex: 0 }} />

          {/* Node 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--aura-bg)', border: '1px solid var(--aura-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aura-gold)', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>1</div>
              <span className="label-syne" style={{ fontSize: '12px', color: 'var(--aura-body)' }}>Instant AI Diagnostic Triage</span>
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: 'var(--aura-cream)', lineHeight: 1.5, margin: 0, paddingLeft: '42px' }}>
              Scouts for mechanical basics in seconds. Identifies pitch flats, rhythmic drift, and skeletal range of motion mismatches using the localized browser neural net.
            </p>
          </div>

          {/* Node 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--aura-bg)', border: '1px solid var(--aura-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aura-cyan)', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>2</div>
              <span className="label-syne" style={{ fontSize: '12px', color: 'var(--aura-body)' }}>Human-Centric Scaffolding</span>
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: 'var(--aura-cream)', lineHeight: 1.5, margin: 0, paddingLeft: '42px' }}>
              Displays detailed, transparent scoring charts overlaid directly onto the video loops. Shows exactly where mistakes occurred without gatekeeping details.
            </p>
          </div>

          {/* Node 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--aura-bg)', border: '1px solid var(--aura-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aura-emerald)', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>3</div>
              <span className="label-syne" style={{ fontSize: '12px', color: 'var(--aura-body)' }}>Decentralized Peer Review</span>
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '11px', color: 'var(--aura-cream)', lineHeight: 1.5, margin: 0, paddingLeft: '42px' }}>
              Allows remote mentors and peers to review time-coded slots, leave vocal critiques, and use consensus ordinal voting to avoid toxic downvote spikes.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: THE "WHY WE BUILT THIS" VALUE PROP ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 500, color: 'var(--aura-body)', margin: 0 }}>
            Friction Turned Into Digital Liberation
          </h2>
          <div style={{ width: '40px', height: '1px', background: 'var(--aura-border)', margin: '8px auto 0' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="grid-responsive-3col">
          
          {/* Benefit 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '3px solid var(--aura-gold)', padding: '20px 18px', background: 'var(--aura-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,225,109,0.06)', border: '1px solid rgba(255,225,109,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aura-gold)', flexShrink: 0 }}>
                <Flame size={14} />
              </div>
              <div className="label-syne" style={{ fontSize: '13px', color: 'var(--aura-body)' }}>Bypass the $250/Hour Gatekeepers</div>
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '11.5px', color: 'var(--aura-cream)', lineHeight: 1.6, margin: 0 }}>
              Under traditional learning, 41% of lower-income families are priced out of performing arts classes. Scénix replaces premium coach fees with high-fidelity, real-time joint-angle checking and vocal pitch tracking algorithms for free.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '3px solid var(--aura-cyan)', padding: '20px 18px', background: 'var(--aura-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(110,231,255,0.06)', border: '1px solid rgba(110,231,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aura-cyan)', flexShrink: 0 }}>
                <Activity size={14} />
              </div>
              <div className="label-syne" style={{ fontSize: '13px', color: 'var(--aura-body)' }}>Zero Rehearsal Space Needed</div>
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '11.5px', color: 'var(--aura-cream)', lineHeight: 1.6, margin: 0 }}>
              Art universities ration studio rooms strictly—often limiting students to just 10 hours of booking per semester. Our advanced camera keypoint normalizer corrects lens distort, turning any bedroom, hallway, or park into a full-scale feedback lab.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '3px solid var(--aura-emerald)', padding: '20px 18px', background: 'var(--aura-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(141,232,144,0.06)', border: '1px solid rgba(141,232,144,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--aura-emerald)', flexShrink: 0 }}>
                <Users size={14} />
              </div>
              <div className="label-syne" style={{ fontSize: '13px', color: 'var(--aura-body)' }}>From Isolation to Industry</div>
            </div>
            <p style={{ fontFamily: 'DM Sans', fontSize: '11.5px', color: 'var(--aura-cream)', lineHeight: 1.6, margin: 0 }}>
              Independent creators often practice in a vacuum, lacking industry access. Scénix aggregates peer review score profiles, letting you export verified pitch-aligned self-tapes and battle telemetry direct to agencies and casting directors.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
