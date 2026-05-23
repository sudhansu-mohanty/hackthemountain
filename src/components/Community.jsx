import React from 'react';

const S = { fontFamily: 'Sora, sans-serif' };
const H = { fontFamily: 'Hanken Grotesk, sans-serif' };

const FEED = [
  {
    tag: 'Masterclass',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDc1muRM_rplO27wBghnqGpN5FU5kCu173dTskxnKb6O-Etuk9nhjVWNLaMCf6aJoJdEA_WB-lE-n2_TxacTSUpuj6HPDtjdklQlev_zyQIT_56IdNHH5WZ3JhS0Of75lkfezT7OpeMiW63Dbj-kF9wY4yE06FwcVsIJZXsVliJYTfsh-6EKoE7nw00bcP4n4RqlTxLLGZwsVYeTyPrfLogGBiKgVDzgKHy97K76OoZaYOtck68u-ZBwaeOR2SjuaFtdYruWzHk0Ekg',
    title: 'Organic Geometry in Nature',
    desc: 'Exploring the golden ratio within redwood structures and its application in modern avant-garde furniture design.',
    likes: '1.2k', comments: '84',
  },
  {
    tag: 'Theory',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUE1R_FO6Fw9H9XA193Z_LvJhFBqycDLkvDGhfyk1n6zQvMB7XS8NSSLhY4P8sv254mJQl2lwcjeFxbnJuqnMLEd-A6iS72Bkf94p0mB9L2XA5Bqsk00wCzYkNM79xEjiXKtJlk3GbkmTsmG589_XPVmEPzC0KzhzguDp-0OOFyfg5AEisr3deIU_Rotb6OtRWmPagdY4ZWmVTwd8uGwa-KNlpg7zJrvZdZtFSuGY5oPEo-K7FYl6jXnabDi2gDRTla0IM2H-R7fhm',
    title: 'The Noir Chronology',
    desc: 'An analysis of dark aesthetic preference in precision engineering and its psychological impact on perception.',
    likes: '942', comments: '156',
  },
];

export default function Community() {
  return (
    <div style={{ backgroundColor: '#121414', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: '32px 20px 0' }}>
        <span style={{ ...H, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffe16d' }}>Editorial</span>
        <h2 style={{ ...S, fontSize: '32px', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#e2e2e2', textTransform: 'uppercase', marginTop: '4px' }}>
          Community Perspective
        </h2>
      </div>

      {/* Featured Essay */}
      <div style={{ margin: '24px 20px 0', position: 'relative', overflow: 'hidden', border: '1px solid #4d4732', borderRadius: '2px' }}>
        <div style={{ aspectRatio: '4/5', overflow: 'hidden' }}>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqfsRXMttpsbZdfqtoN7vH-4EnWnjlW-bC4s1v8Byv69g9tapRMrQBfdVTpwFfncnS9IZicF5SY_qFue03I-GXWX4FIwqGhx6PDAmxdOcJ8eCgE0F3m2PBuBxjoj7nzJVfuqPkuy3HHxTvyosbU-HQ6OFY4slWcc6NHdQBLKBxa5JHtd_u898mgGKkEFCSdMxx67CSrzKCl4ddvjjMgQamlBTR98pjwfmBR4ezP7MNbiqb4sXtBND7wuW2gUE52KQTcu0E5cjJQsy2"
            alt="Architecture of Silence"
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(18,20,20,0) 20%, rgba(18,20,20,0.95) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '32px' }}>
          <span style={{ ...H, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', backgroundColor: '#ffe16d', color: '#221b00', padding: '4px 8px', display: 'inline-block', marginBottom: '12px', letterSpacing: '0.08em' }}>Featured Essay</span>
          <h3 style={{ ...S, fontSize: '32px', fontWeight: 700, lineHeight: 1.1, color: '#e2e2e2', marginBottom: '8px' }}>THE ARCHITECTURE OF SILENCE</h3>
          <p style={{ ...H, fontSize: '16px', color: '#d0c6ab', marginBottom: '20px', opacity: 0.8 }}>By Julian Vance</p>
          <button style={{ border: '1px solid #e2e2e2', padding: '12px 24px', ...H, fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e2e2e2', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '2px', display: 'inline-block', width: 'fit-content' }}>
            Read Essay
          </button>
        </div>
      </div>

      {/* Feed */}
      <div style={{ padding: '32px 20px 128px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {FEED.map(({ tag, img, title, desc, likes, comments }) => (
          <div key={title}>
            <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', border: '1px solid #4d4732', borderRadius: '2px', marginBottom: '16px' }}>
              <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />
              <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                <span style={{ ...H, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', backgroundColor: 'rgba(51,53,53,0.85)', backdropFilter: 'blur(4px)', color: '#ffe16d', padding: '4px 8px', letterSpacing: '0.08em' }}>{tag}</span>
              </div>
            </div>
            <h4 style={{ ...S, fontWeight: 600, fontSize: '22px', color: '#e2e2e2', marginBottom: '6px' }}>{title}</h4>
            <p style={{ ...H, fontSize: '14px', lineHeight: 1.6, color: '#d0c6ab', opacity: 0.75, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</p>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d0c6ab' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>thumb_up</span>
                <span style={{ ...H, fontWeight: 600, fontSize: '13px' }}>{likes}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d0c6ab' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat_bubble</span>
                <span style={{ ...H, fontWeight: 600, fontSize: '13px' }}>{comments}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Wide feature */}
        <div>
          <div style={{ position: 'relative', aspectRatio: '21/9', overflow: 'hidden', border: '1px solid #4d4732', borderRadius: '2px', marginBottom: '16px' }}>
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCc0OFqCSbFxwthUbgLCbSEhmHv1Jmu4R9l1Kt4CQpKhR3989nIMqOfd75f8sVRm9xDBApopE7PQtG80QW4neQSgHXW4DYazM9o7-q2lRioY7i1D-PHh8cwT-aRmMcJrX-V_uv8m7XjdGBRkMu7EQulCqst1fwuxhVA-y4Z41D_M3Hnxyw0tm_3m8ZN3CHHnzkZMTHQX_3M4It87JK9ytA4YOggrfoz-9i2aOE_BXFoWLhSi9aFM6icvih4UY31rkwz4TnHgPXNXuY" alt="Abyss" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />
            <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
              <span style={{ ...H, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', backgroundColor: 'rgba(51,53,53,0.85)', backdropFilter: 'blur(4px)', color: '#ffe16d', padding: '4px 8px', letterSpacing: '0.08em' }}>Theory</span>
            </div>
          </div>
          <h4 style={{ ...S, fontWeight: 600, fontSize: '28px', color: '#e2e2e2', marginBottom: '8px' }}>Aesthetics of the Abyss</h4>
          <p style={{ ...H, fontSize: '14px', lineHeight: 1.6, color: '#d0c6ab', opacity: 0.75, marginBottom: '12px' }}>How minimalist dark-mode interfaces redefine luxury in the digital age by prioritizing focus over ornament.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d0c6ab' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>thumb_up</span>
              <span style={{ ...H, fontWeight: 600, fontSize: '13px' }}>3.4k</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#d0c6ab' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat_bubble</span>
              <span style={{ ...H, fontWeight: 600, fontSize: '13px' }}>241</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
