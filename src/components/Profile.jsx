import React from 'react';

const S = { fontFamily: 'Sora, sans-serif' };
const H = { fontFamily: 'Hanken Grotesk, sans-serif' };

const ACCOLADES = [
  { year: '2023', title: 'Vanguard Performance Prize' },
  { year: '2022', title: 'Global Arts Guild Fellowship' },
  { year: '2021', title: 'Emerging Artist of the Year' },
];

const REEL = [
  { type: 'VIDEO • 04:12', title: 'Nocturnal Ballet', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbMMsJNKpfvaqBzN_0Fe_tHDMKltcx-j8IC7Qswj08M4p384tK-N2V07DMDHqL6e92XlpK-kXMZg7o-bEhAqMvuw6L12OetA08Q9vPSLne4l24Ql0Fzm81Rc2y30jDtqtcR5Y5n57ykGDGt7a4tROCxtIzILgzL1BAG31Uy0XrFgQE8l2u4J7I7DEE_buNH8rlBmxv9xB18bNVN7TGWb3l54-1QJSOEJ4Y2otUvPjhBQ3Bd2FCI-I4znfn7hwr2UlQ6SSjTR9FmyNf' },
  { type: 'SHORT FILM • 02:45', title: 'Gilded Silence', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOsgUGjDbtmAhtWP7e6r4REjF01p9dwD4e-wdN5hBjYdklUMrDS1V_30ltBXc1B4AwkONISxNlrkLfP8Kzo3tl_Hj9t8sqP2zPciPqZ7DKF3DNXLZJcNi-hNLRiBWuUfjK4HPoPJ8YM1oVF-p4aoYtbb0UR_Q54wJzolX8zi2JKSyTtFWrA9RTotYvZgWT93pBPLPL0Pus3zU-c7c5ky2XhRQ775d_66vvaZDSmhveIu6ORDGWzcfqL1BIJXSKfnh43wJ_c2TRClc-' },
];

export default function Profile() {
  return (
    <div style={{ backgroundColor: '#121414', minHeight: '100%' }}>
      {/* Hero */}
      <section style={{ position: 'relative', height: '420px', overflow: 'hidden' }}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrp-eiOiJYdv3c2vJoQupUqs_xZgX8UsbtCiWhLED6LA_VBY41O-6nXJSBa4VgYv1EmApkQ5JcBl3KMx4c9EIu4Rque1tiXAXsBf-tJ-mQwUJ_-zH23rD7W2XlqGgBSQ4eEFfdq2XOlGHpkbLLt00LiHIi8BWsotEUSzz_n1uRa7-XYKZlNPUBFrKfpxafswEodWYZyjRUiKbrlvenKsGeP2UxTq8KyHFEU8rTzjLfOktf4DSRFsT5dgCEOzNOcvFybGPsQk7mWE-B"
          alt="Julian Thorne"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'grayscale(1) brightness(0.75)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(18,20,20,0) 30%, rgba(18,20,20,1) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px' }}>
          <h2 style={{ ...S, fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>JULIAN THORNE</h2>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
            <div>
              <span style={{ ...S, fontWeight: 600, fontSize: '22px', color: '#ffe16d', display: 'block' }}>1.2K</span>
              <span style={{ ...H, fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c9c6c5' }}>Followers</span>
            </div>
            <div style={{ width: '1px', backgroundColor: '#4d4732' }} />
            <div>
              <span style={{ ...S, fontWeight: 600, fontSize: '22px', color: '#ffe16d', display: 'block' }}>24</span>
              <span style={{ ...H, fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c9c6c5' }}>Productions</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ flex: 1, backgroundColor: '#ffe16d', color: '#221b00', padding: '14px', border: 'none', borderRadius: '2px', cursor: 'pointer', ...H, fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Follow
            </button>
            <button style={{ flex: 1, backgroundColor: 'transparent', color: '#c9c6c5', padding: '14px', border: '1px solid #c9c6c5', borderRadius: '2px', cursor: 'pointer', ...H, fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Message
            </button>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section style={{ padding: '32px 20px', backgroundColor: '#0c0f0f', borderTop: '1px solid #4d4732', borderBottom: '1px solid #4d4732' }}>
        <p style={{ ...S, fontWeight: 600, fontSize: '18px', color: '#c9c6c5', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5 }}>
          "Artistry is the bridge between the physical exertion of performance and the ethereal grace of the human spirit."
        </p>
      </section>

      {/* Performance Reel */}
      <section style={{ padding: '48px 20px' }}>
        <h3 style={{ ...H, fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ffe16d', textAlign: 'center', marginBottom: '24px' }}>
          Performance Reel
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {REEL.map(({ type, title, img }) => (
            <div key={title} style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '4px', border: '1px solid #4d4732' }}>
              <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(18,20,20,0.95) 0%, transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px' }}>
                <span style={{ ...H, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#e9c400', letterSpacing: '0.08em', marginBottom: '4px' }}>{type}</span>
                <h4 style={{ ...S, fontWeight: 600, fontSize: '20px', color: '#fff' }}>{title}</h4>
              </div>
              {/* Play button */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '1px solid #ffe16d', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(18,20,20,0.3)', backdropFilter: 'blur(4px)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#ffe16d' }}>play_arrow</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Honors */}
      <section style={{ padding: '0 0 128px', backgroundColor: '#1a1c1c' }}>
        <h3 style={{ ...H, fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ffe16d', textAlign: 'center', padding: '40px 20px 24px' }}>
          Honors &amp; Accolades
        </h3>
        {ACCOLADES.map(({ year, title }) => (
          <div key={title}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid rgba(77,71,50,0.3)', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#282a2b')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div>
              <span style={{ ...H, fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c9c6c5', display: 'block', marginBottom: '2px' }}>{year}</span>
              <p style={{ ...S, fontWeight: 600, fontSize: '18px', color: '#e2e2e2' }}>{title}</p>
            </div>
            <span className="material-symbols-outlined" style={{ color: '#ffe16d', fontSize: '20px' }}>arrow_forward</span>
          </div>
        ))}
      </section>
    </div>
  );
}
