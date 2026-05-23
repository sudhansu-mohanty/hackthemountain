<!-- Aura: Select Performance Source (v2) -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&amp;family=Hanken+Grotesk:wght@400;500;600&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24;
        }
        body {
            background-color: #0c0f0f;
            color: #e2e2e2;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }
        .noir-gradient {
            background: linear-gradient(180deg, rgba(12, 15, 15, 0) 0%, rgba(12, 15, 15, 0.9) 70%, #0c0f0f 100%);
        }
        .performance-glow {
            box-shadow: 0 0 20px rgba(233, 196, 0, 0.1);
        }
        .mask-image-bento {
            mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-secondary": "#313030",
                      "surface-tint": "#e9c400",
                      "primary-fixed-dim": "#e9c400",
                      "on-secondary-fixed": "#1c1b1b",
                      "surface-container-highest": "#333535",
                      "primary-fixed": "#ffe16d",
                      "on-background": "#e2e2e2",
                      "inverse-surface": "#e2e2e2",
                      "on-primary-container": "#705e00",
                      "on-tertiary-container": "#605f5e",
                      "on-primary-fixed-variant": "#544600",
                      "tertiary": "#f9f5f5",
                      "on-error": "#690005",
                      "inverse-primary": "#705d00",
                      "error": "#ffb4ab",
                      "surface-dim": "#121414",
                      "tertiary-container": "#dcd9d9",
                      "background": "#121414",
                      "surface-container-high": "#282a2b",
                      "on-tertiary-fixed-variant": "#474746",
                      "on-tertiary-fixed": "#1c1b1b",
                      "surface-container": "#1e2020",
                      "on-tertiary": "#313030",
                      "surface-container-lowest": "#0c0f0f",
                      "error-container": "#93000a",
                      "surface-container-low": "#1a1c1c",
                      "on-primary-fixed": "#221b00",
                      "tertiary-fixed-dim": "#c8c6c5",
                      "secondary-container": "#4a4949",
                      "inverse-on-surface": "#2f3131",
                      "on-primary": "#3a3000",
                      "surface": "#121414",
                      "on-surface": "#e2e2e2",
                      "on-surface-variant": "#d0c6ab",
                      "secondary-fixed-dim": "#c9c6c5",
                      "tertiary-fixed": "#e5e2e1",
                      "surface-bright": "#38393a",
                      "secondary-fixed": "#e5e2e1",
                      "outline": "#999077",
                      "on-error-container": "#ffdad6",
                      "on-secondary-fixed-variant": "#474646",
                      "on-secondary-container": "#bab8b7",
                      "primary": "#fff6df",
                      "outline-variant": "#4d4732",
                      "secondary": "#c9c6c5",
                      "surface-variant": "#333535",
                      "primary-container": "#ffd700"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {
                      "margin-mobile": "20px",
                      "gutter": "24px",
                      "xs": "4px",
                      "unit": "4px",
                      "lg": "32px",
                      "md": "16px",
                      "sm": "8px",
                      "margin-desktop": "80px",
                      "xl": "64px",
                      "xxl": "128px"
              },
              "fontFamily": {
                      "body-md": ["Hanken Grotesk"],
                      "display-lg-mobile": ["Sora"],
                      "headline-xl": ["Sora"],
                      "label-sm": ["Hanken Grotesk"],
                      "label-md": ["Hanken Grotesk"],
                      "headline-xl-mobile": ["Sora"],
                      "display-lg": ["Sora"],
                      "headline-md": ["Sora"],
                      "body-lg": ["Hanken Grotesk"]
              },
              "fontSize": {
                      "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                      "display-lg-mobile": ["40px", {"lineHeight": "1.1", "letterSpacing": "-0.03em", "fontWeight": "700"}],
                      "headline-xl": ["40px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                      "label-sm": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "500"}],
                      "label-md": ["14px", {"lineHeight": "1.2", "letterSpacing": "0.1em", "fontWeight": "600"}],
                      "headline-xl-mobile": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                      "display-lg": ["64px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
                      "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "600"}],
                      "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
              }
            },
          },
        }
    </script>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface-container-lowest">
<!-- Top App Bar -->
<header class="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-margin-mobile py-md">
<button class="text-on-surface hover:opacity-80 transition-opacity active:scale-95 duration-200">
<span class="material-symbols-outlined">menu</span>
</button>
<h1 class="font-display-lg-mobile text-[24px] tracking-[0.2em] text-primary-fixed font-bold">AURA</h1>
<button class="text-on-surface hover:opacity-80 transition-opacity active:scale-95 duration-200">
<span class="material-symbols-outlined">notifications</span>
</button>
</header>
<main class="pt-[72px] pb-xxl">
<!-- Hero Section -->
<section class="relative h-[751px] w-full flex flex-col justify-end px-margin-mobile overflow-hidden">
<div class="absolute inset-0 z-0">
<img alt="Performance Art" class="w-full h-full object-cover grayscale brightness-50 contrast-125" data-alt="A cinematic low-angle photograph of a solo performance artist captured mid-movement on a dark, minimalist stage. Harsh spotlighting from above creates sharp highlights on their silhouette while the background dissolves into deep charcoal shadows. The atmosphere is prestigious and intense, echoing a luxury Noir aesthetic with high-contrast lighting and a sense of focused power. The color palette is monochromatic with extremely subtle warm gold undertones in the highlights." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCf4Oum-QQMMcISOHGqeUqKq6t1r_uTGK8vvafkjIZ4AYNlEyy88a_-udoB6IDogAcmYJyjJo98nZR6_ci6rJcyL_Nmr9rfS8YKRzrwldc0HDDKdju1cRE27E3usO9OK9xkkacZtpkpP4UOWI6hNHK2r5mDQAvf7d9B_CeiinG1-pnL1cBbJFqjMO2tAf1i3XpIaGHRLhlv2NyOODQiRX7yCWUzDwdh0tFjlLiX1NSSgrXrw8k1b6DBgeUYA4BdDLKVuAd9fW_8BeN7"/>
<div class="absolute inset-0 noir-gradient"></div>
</div>
<div class="relative z-10 mb-xl max-w-xl">
<h2 class="font-display-lg-mobile text-display-lg-mobile text-primary mb-md">Your Stage, Your Director.</h2>
<p class="font-body-md text-on-surface-variant opacity-80 mb-lg">Precision analytics meets cinematic storytelling. Capture your mastery with the world's most advanced performance engine.</p>
<div class="flex flex-col gap-sm">
<button class="w-full bg-primary-container text-on-primary py-md font-label-md uppercase tracking-widest rounded-DEFAULT hover:brightness-110 active:scale-[0.98] transition-all">
                        LIVE PERFORMANCE RECORD
                    </button>
<button class="w-full border border-on-surface/20 text-on-surface py-md font-label-md uppercase tracking-widest rounded-DEFAULT hover:bg-white/5 active:scale-[0.98] transition-all">
                        UPLOAD EXISTING VIDEO
                    </button>
</div>
</div>
</section>
<!-- Studio Precision -->
<section class="mt-xxl px-margin-mobile">
<div class="flex items-center gap-md mb-xl">
<div class="h-[1px] flex-grow bg-outline-variant/30"></div>
<h3 class="font-headline-md text-primary-fixed uppercase tracking-[0.1em]">Studio Precision</h3>
<div class="h-[1px] flex-grow bg-outline-variant/30"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
<!-- Card 1 -->
<div class="bg-surface-container-low border border-outline-variant/20 p-lg relative overflow-hidden group">
<div class="relative z-10">
<span class="material-symbols-outlined text-primary-fixed mb-md">analytics</span>
<h4 class="font-headline-md text-on-surface mb-sm">Biometric Analysis</h4>
<p class="font-body-md text-on-surface-variant mb-md">Real-time posture, velocity, and alignment tracking via neural mapping.</p>
<button class="font-label-sm uppercase text-primary-fixed tracking-widest flex items-center gap-xs group-hover:gap-sm transition-all">
                            View Engine <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
</button>
</div>
<div class="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
<span class="material-symbols-outlined text-[120px]">flare</span>
</div>
</div>
<!-- Card 2 -->
<div class="bg-surface-container-low border border-outline-variant/20 p-lg relative overflow-hidden group">
<div class="relative z-10">
<span class="material-symbols-outlined text-primary-fixed mb-md">movie</span>
<h4 class="font-headline-md text-on-surface mb-sm">Cinematic Feedback</h4>
<p class="font-body-md text-on-surface-variant mb-md">Dynamic lighting overlays and frame-by-frame professional critiques.</p>
<button class="font-label-sm uppercase text-primary-fixed tracking-widest flex items-center gap-xs group-hover:gap-sm transition-all">
                            Explore Tools <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
</button>
</div>
<div class="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
<span class="material-symbols-outlined text-[120px]">camera</span>
</div>
</div>
</div>
</section>
<!-- Weekly Momentum -->
<section class="mt-xxl px-margin-mobile">
<div class="flex flex-col mb-xl">
<h3 class="font-headline-md text-primary-fixed uppercase tracking-[0.1em]">Weekly Momentum</h3>
<p class="font-label-sm text-on-surface-variant mt-xs">Current Path to Mastery</p>
</div>
<div class="space-y-lg">
<!-- Item 1 -->
<div>
<div class="flex justify-between items-end mb-sm">
<span class="font-label-md uppercase tracking-widest text-on-surface">Classical Ballet</span>
<span class="font-label-sm text-primary-fixed">88%</span>
</div>
<div class="h-[2px] w-full bg-outline-variant/20 overflow-hidden">
<div class="h-full bg-primary-fixed w-[88%] performance-glow relative">
<div class="absolute right-0 top-0 h-full w-4 bg-white/20 blur-sm"></div>
</div>
</div>
</div>
<!-- Item 2 -->
<div>
<div class="flex justify-between items-end mb-sm">
<span class="font-label-md uppercase tracking-widest text-on-surface">Method Acting</span>
<span class="font-label-sm text-primary-fixed">64%</span>
</div>
<div class="h-[2px] w-full bg-outline-variant/20 overflow-hidden">
<div class="h-full bg-primary-fixed w-[64%] performance-glow relative">
<div class="absolute right-0 top-0 h-full w-4 bg-white/20 blur-sm"></div>
</div>
</div>
</div>
<!-- Item 3 -->
<div>
<div class="flex justify-between items-end mb-sm">
<span class="font-label-md uppercase tracking-widest text-on-surface">Modern Improv</span>
<span class="font-label-sm text-primary-fixed">42%</span>
</div>
<div class="h-[2px] w-full bg-outline-variant/20 overflow-hidden">
<div class="h-full bg-primary-fixed w-[42%] performance-glow relative">
<div class="absolute right-0 top-0 h-full w-4 bg-white/20 blur-sm"></div>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Bottom Nav Bar -->
<nav class="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-t border-outline-variant/30 flex justify-around items-center px-xl pb-lg pt-md">
<!-- JUDGE (Inactive) -->
<button class="flex flex-col items-center justify-center text-secondary pt-2 group transition-all duration-300 hover:text-primary-fixed-dim">
<span class="material-symbols-outlined text-[28px]">analytics</span>
<span class="sr-only">JUDGE</span>
</button>
<!-- COMMUNITY (Inactive) -->
<button class="flex flex-col items-center justify-center text-secondary pt-2 group transition-all duration-300 hover:text-primary-fixed-dim">
<span class="material-symbols-outlined text-[28px]">group</span>
<span class="sr-only">COMMUNITY</span>
</button>
<!-- PROFILE (Active for this landing/personal view) -->
<button class="flex flex-col items-center justify-center text-primary-fixed border-t-2 border-primary-fixed -mt-0.5 pt-2 active:scale-110 transition-all duration-300">
<span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">person</span>
<span class="sr-only">PROFILE</span>
</button>
</nav>
<script>
        // Atmospheric Micro-interaction for mastery bars
        document.addEventListener('DOMContentLoaded', () => {
            const bars = document.querySelectorAll('.performance-glow');
            bars.forEach(bar => {
                const finalWidth = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.transition = 'width 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    bar.style.width = finalWidth;
                }, 300);
            });
        });
    </script>
</body></html>

<!-- AI Judge (v2) -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AURA | Mastery Audit Results</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&amp;family=Sora:wght@600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-secondary": "#313030",
                    "surface-tint": "#e9c400",
                    "primary-fixed-dim": "#e9c400",
                    "on-secondary-fixed": "#1c1b1b",
                    "surface-container-highest": "#333535",
                    "primary-fixed": "#ffe16d",
                    "on-background": "#e2e2e2",
                    "inverse-surface": "#e2e2e2",
                    "on-primary-container": "#705e00",
                    "on-tertiary-container": "#605f5e",
                    "on-primary-fixed-variant": "#544600",
                    "tertiary": "#f9f5f5",
                    "on-error": "#690005",
                    "inverse-primary": "#705d00",
                    "error": "#ffb4ab",
                    "surface-dim": "#121414",
                    "tertiary-container": "#dcd9d9",
                    "background": "#121414",
                    "surface-container-high": "#282a2b",
                    "on-tertiary-fixed-variant": "#474746",
                    "on-tertiary-fixed": "#1c1b1b",
                    "surface-container": "#1e2020",
                    "on-tertiary": "#313030",
                    "surface-container-lowest": "#0c0f0f",
                    "error-container": "#93000a",
                    "surface-container-low": "#1a1c1c",
                    "on-primary-fixed": "#221b00",
                    "tertiary-fixed-dim": "#c8c6c5",
                    "secondary-container": "#4a4949",
                    "inverse-on-surface": "#2f3131",
                    "on-primary": "#3a3000",
                    "surface": "#121414",
                    "on-surface": "#e2e2e2",
                    "on-surface-variant": "#d0c6ab",
                    "secondary-fixed-dim": "#c9c6c5",
                    "tertiary-fixed": "#e5e2e1",
                    "surface-bright": "#38393a",
                    "secondary-fixed": "#e5e2e1",
                    "outline": "#999077",
                    "on-error-container": "#ffdad6",
                    "on-secondary-fixed-variant": "#474646",
                    "on-secondary-container": "#bab8b7",
                    "primary": "#fff6df",
                    "outline-variant": "#4d4732",
                    "secondary": "#c9c6c5",
                    "surface-variant": "#333535",
                    "primary-container": "#ffd700"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "margin-mobile": "20px",
                    "gutter": "24px",
                    "xs": "4px",
                    "unit": "4px",
                    "lg": "32px",
                    "md": "16px",
                    "sm": "8px",
                    "margin-desktop": "80px",
                    "xl": "64px",
                    "xxl": "128px"
            },
            "fontFamily": {
                    "body-md": ["Hanken Grotesk"],
                    "display-lg-mobile": ["Sora"],
                    "headline-xl": ["Sora"],
                    "label-sm": ["Hanken Grotesk"],
                    "label-md": ["Hanken Grotesk"],
                    "headline-xl-mobile": ["Sora"],
                    "display-lg": ["Sora"],
                    "headline-md": ["Sora"],
                    "body-lg": ["Hanken Grotesk"]
            },
            "fontSize": {
                    "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "display-lg-mobile": ["40px", {"lineHeight": "1.1", "letterSpacing": "-0.03em", "fontWeight": "700"}],
                    "headline-xl": ["40px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                    "label-sm": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "500"}],
                    "label-md": ["14px", {"lineHeight": "1.2", "letterSpacing": "0.1em", "fontWeight": "600"}],
                    "headline-xl-mobile": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                    "display-lg": ["64px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
                    "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "600"}],
                    "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24;
        }
        .circular-gauge-container {
            position: relative;
            width: 240px;
            height: 240px;
        }
        .circular-gauge-svg {
            transform: rotate(-90deg);
        }
        .circular-gauge-bg {
            fill: none;
            stroke: #1e2020;
            stroke-width: 8;
        }
        .circular-gauge-progress {
            fill: none;
            stroke: url(#goldGradient);
            stroke-width: 8;
            stroke-linecap: square;
            stroke-dasharray: 628;
            stroke-dashoffset: calc(628 - (628 * 82) / 100);
            transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .noir-glow {
            box-shadow: 0 0 40px rgba(233, 196, 0, 0.05);
        }
        body {
            background-color: #0c0f0f;
            overflow-x: hidden;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed">
<!-- Top App Bar (Shared Component) -->
<header class="bg-background dark:bg-background border-b border-outline-variant dark:border-outline-variant docked full-width top-0 z-50 fixed flex justify-between items-center w-full px-margin-mobile py-md">
<div class="flex items-center gap-md">
<button class="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-200">
<span class="material-symbols-outlined" data-icon="menu">menu</span>
</button>
</div>
<h1 class="font-display-lg-mobile text-display-lg-mobile tracking-[0.2em] text-primary-fixed dark:text-primary-fixed">AURA</h1>
<div class="flex items-center gap-md">
<button class="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-200">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
</div>
</header>
<main class="pt-[100px] pb-32 px-margin-mobile max-w-2xl mx-auto min-h-screen">
<!-- Mastery Gauge Section -->
<section class="flex flex-col items-center justify-center py-xl">
<div class="circular-gauge-container mb-md">
<svg class="circular-gauge-svg w-full h-full" viewbox="0 0 210 210">
<defs>
<lineargradient id="goldGradient" x1="0%" x2="100%" y1="0%" y2="100%">
<stop offset="0%" style="stop-color:#ffe16d;stop-opacity:1"></stop>
<stop offset="100%" style="stop-color:#e9c400;stop-opacity:1"></stop>
</lineargradient>
</defs>
<circle class="circular-gauge-bg" cx="105" cy="105" r="100"></circle>
<circle class="circular-gauge-progress" cx="105" cy="105" r="100"></circle>
</svg>
<div class="absolute inset-0 flex flex-col items-center justify-center">
<span class="font-display-lg-mobile text-display-lg-mobile text-primary-fixed leading-none">82</span>
<span class="font-label-md text-label-md text-on-surface-variant tracking-[0.3em] uppercase mt-xs">Overall</span>
</div>
</div>
<div class="text-center mt-sm">
<h2 class="font-headline-md text-headline-md text-on-surface">Mastery Audit Complete</h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-xs opacity-60">Performance ID: #AX-9921</p>
</div>
</section>
<!-- Insights Grid -->
<div class="grid grid-cols-1 gap-gutter">
<!-- Stage Posture Card -->
<div class="bg-surface-container-low border border-outline-variant p-lg rounded-none noir-glow relative overflow-hidden">
<div class="absolute top-0 right-0 p-md opacity-10">
<span class="material-symbols-outlined text-[64px]" data-icon="accessibility_new">accessibility_new</span>
</div>
<div class="flex justify-between items-start mb-xl">
<div>
<span class="font-label-sm text-label-sm text-primary-fixed uppercase tracking-widest block mb-xs">Metrics</span>
<h3 class="font-headline-md text-headline-md text-on-surface">Stage Posture</h3>
</div>
<div class="text-right">
<span class="font-display-lg-mobile text-[32px] text-primary-fixed block leading-none">92%</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">Precision</span>
</div>
</div>
<div class="space-y-md">
<div class="h-[1px] bg-outline-variant w-full"></div>
<p class="font-body-md text-body-md text-on-surface-variant">Exceptional alignment. Your spinal verticality remains consistent throughout movement transitions, projecting authority and presence.</p>
</div>
</div>
<!-- Vocal Resonance Card -->
<div class="bg-surface-container-low border border-outline-variant p-lg rounded-none noir-glow relative overflow-hidden">
<div class="absolute top-0 right-0 p-md opacity-10">
<span class="material-symbols-outlined text-[64px]" data-icon="graphic_eq">graphic_eq</span>
</div>
<div class="flex justify-between items-start mb-xl">
<div>
<span class="font-label-sm text-label-sm text-primary-fixed uppercase tracking-widest block mb-xs">Acoustics</span>
<h3 class="font-headline-md text-headline-md text-on-surface">Vocal Resonance</h3>
</div>
<div class="text-right">
<span class="font-display-lg-mobile text-[32px] text-on-surface block leading-none">74%</span>
<span class="font-label-sm text-label-sm text-on-surface-variant">Depth</span>
</div>
</div>
<div class="space-y-md">
<div class="h-[1px] bg-outline-variant w-full"></div>
<p class="font-body-md text-body-md text-on-surface-variant">Minor breathiness detected in mid-sentence pauses. Focus on diaphragmatic support to maintain tonal weight during extended delivery.</p>
</div>
</div>
</div>
<!-- Action Button -->
<div class="mt-xxl mb-lg flex justify-center">
<button class="bg-primary-container text-on-primary-container px-xl py-md font-label-md text-label-md uppercase tracking-[0.2em] rounded-none hover:opacity-90 transition-all active:scale-95 flex items-center gap-sm">
<span class="material-symbols-outlined text-[20px]" data-icon="replay">replay</span>
                Re-record Audit
            </button>
</div>
</main>
<!-- Bottom Navigation Bar (Shared Component) -->
<nav class="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-t border-outline-variant dark:border-outline-variant flex justify-around items-center px-xl pb-lg pt-md">
<!-- Analytics -->
<a class="flex flex-col items-center justify-center text-secondary dark:text-secondary pt-2 hover:text-primary-fixed-dim transition-colors active:scale-110 transition-all duration-300" href="#">
<span class="material-symbols-outlined" data-icon="analytics">analytics</span>
</a>
<!-- Judge (ACTIVE) -->
<a class="flex flex-col items-center justify-center text-primary-fixed dark:text-primary-fixed border-t-2 border-primary-fixed -mt-0.5 pt-2 active:scale-110 transition-all duration-300" href="#">
<span class="material-symbols-outlined" data-icon="group" style="font-variation-settings: 'FILL' 1;">group</span>
</a>
<!-- Person -->
<a class="flex flex-col items-center justify-center text-secondary dark:text-secondary pt-2 hover:text-primary-fixed-dim transition-colors active:scale-110 transition-all duration-300" href="#">
<span class="material-symbols-outlined" data-icon="person">person</span>
</a>
</nav>
<script>
        // Micro-interaction: Smooth gauge entry
        window.addEventListener('load', () => {
            const progressCircle = document.querySelector('.circular-gauge-progress');
            // Re-trigger dashoffset for animation effect
            progressCircle.style.strokeDashoffset = '628';
            setTimeout(() => {
                progressCircle.style.strokeDashoffset = (628 - (628 * 82) / 100).toString();
            }, 300);
        });

        // Simple parallax effect for cards on hover
        document.querySelectorAll('.bg-surface-container-low').forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
                card.style.borderColor = 'rgba(255, 225, 109, 0.3)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.borderColor = '';
            });
        });
    </script>
</body></html>

<!-- Aura Community (v2) -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Aura Community Feed</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&amp;family=Sora:wght@600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-secondary": "#313030",
                    "surface-tint": "#e9c400",
                    "primary-fixed-dim": "#e9c400",
                    "on-secondary-fixed": "#1c1b1b",
                    "surface-container-highest": "#333535",
                    "primary-fixed": "#ffe16d",
                    "on-background": "#e2e2e2",
                    "inverse-surface": "#e2e2e2",
                    "on-primary-container": "#705e00",
                    "on-tertiary-container": "#605f5e",
                    "on-primary-fixed-variant": "#544600",
                    "tertiary": "#f9f5f5",
                    "on-error": "#690005",
                    "inverse-primary": "#705d00",
                    "error": "#ffb4ab",
                    "surface-dim": "#121414",
                    "tertiary-container": "#dcd9d9",
                    "background": "#121414",
                    "surface-container-high": "#282a2b",
                    "on-tertiary-fixed-variant": "#474746",
                    "on-tertiary-fixed": "#1c1b1b",
                    "surface-container": "#1e2020",
                    "on-tertiary": "#313030",
                    "surface-container-lowest": "#0c0f0f",
                    "error-container": "#93000a",
                    "surface-container-low": "#1a1c1c",
                    "on-primary-fixed": "#221b00",
                    "tertiary-fixed-dim": "#c8c6c5",
                    "secondary-container": "#4a4949",
                    "inverse-on-surface": "#2f3131",
                    "on-primary": "#3a3000",
                    "surface": "#121414",
                    "on-surface": "#e2e2e2",
                    "on-surface-variant": "#d0c6ab",
                    "secondary-fixed-dim": "#c9c6c5",
                    "tertiary-fixed": "#e5e2e1",
                    "surface-bright": "#38393a",
                    "secondary-fixed": "#e5e2e1",
                    "outline": "#999077",
                    "on-error-container": "#ffdad6",
                    "on-secondary-fixed-variant": "#474646",
                    "on-secondary-container": "#bab8b7",
                    "primary": "#fff6df",
                    "outline-variant": "#4d4732",
                    "secondary": "#c9c6c5",
                    "surface-variant": "#333535",
                    "primary-container": "#ffd700"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "margin-mobile": "20px",
                    "gutter": "24px",
                    "xs": "4px",
                    "unit": "4px",
                    "lg": "32px",
                    "md": "16px",
                    "sm": "8px",
                    "margin-desktop": "80px",
                    "xl": "64px",
                    "xxl": "128px"
            },
            "fontFamily": {
                    "body-md": ["Hanken Grotesk"],
                    "display-lg-mobile": ["Sora"],
                    "headline-xl": ["Sora"],
                    "label-sm": ["Hanken Grotesk"],
                    "label-md": ["Hanken Grotesk"],
                    "headline-xl-mobile": ["Sora"],
                    "display-lg": ["Sora"],
                    "headline-md": ["Sora"],
                    "body-lg": ["Hanken Grotesk"]
            },
            "fontSize": {
                    "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "display-lg-mobile": ["40px", {"lineHeight": "1.1", "letterSpacing": "-0.03em", "fontWeight": "700"}],
                    "headline-xl": ["40px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                    "label-sm": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "500"}],
                    "label-md": ["14px", {"lineHeight": "1.2", "letterSpacing": "0.1em", "fontWeight": "600"}],
                    "headline-xl-mobile": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                    "display-lg": ["64px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
                    "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "600"}],
                    "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
            }
          },
        },
      }
    </script>
<style>
        .noir-gradient {
            background: linear-gradient(180deg, rgba(18, 20, 20, 0) 0%, rgba(18, 20, 20, 0.9) 100%);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24;
        }
        body {
            background-color: #121414;
            color: #e2e2e2;
            -webkit-font-smoothing: antialiased;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="font-body-md text-body-md overflow-x-hidden">
<!-- Top AppBar - Following Shared Components JSON -->
<header class="bg-background dark:bg-background border-b border-outline-variant dark:border-outline-variant docked full-width top-0 sticky z-50">
<div class="flex justify-between items-center w-full px-margin-mobile py-md max-w-screen-xl mx-auto">
<button class="hover:opacity-80 transition-opacity active:scale-95 transition-transform duration-200">
<span class="material-symbols-outlined text-primary-fixed dark:text-primary-fixed" data-icon="menu">menu</span>
</button>
<h1 class="font-display-lg-mobile text-display-lg-mobile tracking-[0.2em] text-primary-fixed dark:text-primary-fixed">AURA</h1>
<button class="hover:opacity-80 transition-opacity active:scale-95 transition-transform duration-200">
<span class="material-symbols-outlined text-primary-fixed dark:text-primary-fixed" data-icon="notifications">notifications</span>
</button>
</div>
</header>
<main class="min-h-screen pb-xxl">
<!-- Hero Section: Community Perspective -->
<section class="px-margin-mobile pt-xl mb-xxl max-w-screen-xl mx-auto">
<div class="flex flex-col gap-sm mb-lg">
<span class="font-label-md text-label-md uppercase tracking-widest text-primary-fixed">Editorial</span>
<h2 class="font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface uppercase tracking-tight">COMMUNITY PERSPECTIVE</h2>
</div>
<!-- Featured Essay: The Architecture of Silence -->
<article class="relative group overflow-hidden bg-surface-container-low border border-outline-variant transition-all duration-700 hover:border-primary-fixed/30">
<div class="aspect-[4/5] md:aspect-[21/9] w-full overflow-hidden">
<img alt="Architecture" class="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000" data-alt="A striking architectural photography shot of a brutalist concrete structure with sharp angles and deep shadows against a dark moody sky. The composition is minimalist and avant-garde, emphasizing texture and volume. The lighting is low-key and dramatic, creating a noir aesthetic with a monochromatic palette accented by subtle gold reflections on polished surfaces. The mood is silent, powerful, and exclusive." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqfsRXMttpsbZdfqtoN7vH-4EnWnjlW-bC4s1v8Byv69g9tapRMrQBfdVTpwFfncnS9IZicF5SY_qFue03I-GXWX4FIwqGhx6PDAmxdOcJ8eCgE0F3m2PBuBxjoj7nzJVfuqPkuy3HHxTvyosbU-HQ6OFY4slWcc6NHdQBLKBxa5JHtd_u898mgGKkEFCSdMxx67CSrzKCl4ddvjjMgQamlBTR98pjwfmBR4ezP7MNbiqb4sXtBND7wuW2gUE52KQTcu0E5cjJQsy2"/>
</div>
<div class="absolute inset-0 noir-gradient flex flex-col justify-end p-lg md:p-xl">
<div class="max-w-2xl">
<span class="font-label-sm text-label-sm uppercase bg-primary-fixed text-on-primary-fixed px-sm py-xs mb-md inline-block">Featured Essay</span>
<h3 class="font-display-lg-mobile text-display-lg-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-sm leading-tight">THE ARCHITECTURE OF SILENCE</h3>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-lg opacity-80">By Julian Vance</p>
<button class="border border-on-surface px-lg py-md font-label-md text-label-md uppercase tracking-widest hover:bg-on-surface hover:text-background transition-colors">
                            Read Essay
                        </button>
</div>
</div>
</article>
</section>
<!-- Feed Grid -->
<section class="px-margin-mobile grid grid-cols-1 md:grid-cols-2 gap-xl max-w-screen-xl mx-auto">
<!-- Feed Item: Masterclass -->
<div class="flex flex-col gap-md group">
<div class="relative bg-surface-container-low aspect-video overflow-hidden border border-outline-variant">
<img alt="Forest Masterclass" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" data-alt="An ethereal high-contrast forest scene at dawn with rays of light piercing through dense fog and ancient trees. The aesthetic is deep noir with heavy blacks and silvery highlights, creating an atmosphere of mystery and precision. The visual style is crisp and gallery-ready, utilizing a dark luxury palette with performance gold light flares." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc1muRM_rplO27wBghnqGpN5FU5kCu173dTskxnKb6O-Etuk9nhjVWNLaMCf6aJoJdEA_WB-lE-n2_TxacTSUpuj6HPDtjdklQlev_zyQIT_56IdNHH5WZ3JhS0Of75lkfezT7OpeMiW63Dbj-kF9wY4yE06FwcVsIJZXsVliJYTfsh-6EKoE7nw00bcP4n4RqlTxLLGZwsVYeTyPrfLogGBiKgVDzgKHy97K76OoZaYOtck68u-ZBwaeOR2SjuaFtdYruWzHk0Ekg"/>
<div class="absolute top-md left-md">
<span class="bg-surface-container-highest/80 backdrop-blur px-sm py-xs font-label-sm text-label-sm text-primary-fixed uppercase tracking-widest">Masterclass</span>
</div>
</div>
<div class="py-md">
<h4 class="font-headline-md text-headline-md text-on-surface mb-xs">Organic Geometry in Nature</h4>
<p class="font-body-md text-body-md text-on-surface-variant mb-md line-clamp-2 opacity-70">Exploring the golden ratio within redwood structures and its application in modern avant-garde furniture design.</p>
<div class="flex items-center gap-lg">
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]" data-icon="thumb_up">thumb_up</span>
<span class="font-label-md text-label-md">1.2k</span>
</div>
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]" data-icon="chat_bubble">chat_bubble</span>
<span class="font-label-md text-label-md">84</span>
</div>
</div>
</div>
</div>
<!-- Feed Item: Theory -->
<div class="flex flex-col gap-md group">
<div class="relative bg-surface-container-low aspect-video overflow-hidden border border-outline-variant">
<img alt="Theory of Shadow" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" data-alt="A minimalist close-up of a high-end luxury watch movement, showcasing intricate golden gears and polished black plates. The lighting is surgical and precise, highlighting the mechanical complexity through sharp shadows. The mood is one of power, technical excellence, and noir sophistication, fitting a premium digital gallery experience." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUE1R_FO6Fw9H9XA193Z_LvJhFBqycDLkvDGhfyk1n6zQvMB7XS8NSSLhY4P8sv254mJQl2lwcjeFxbnJuqnMLEd-A6iS72Bkf94p0mB9L2XA5Bqsk00wCzYkNM79xEjiXKtJlk3GbkmTsmG589_XPVmEPzC0KzhzguDp-0OOFyfg5AEisr3deIU_Rotb6OtRWmPagdY4ZWmVTwd8uGwa-KNlpg7zJrvZdZtFSuGY5oPEo-K7FYl6jXnabDi2gDRTla0IM2H-R7fhm"/>
<div class="absolute top-md left-md">
<span class="bg-surface-container-highest/80 backdrop-blur px-sm py-xs font-label-sm text-label-sm text-primary-fixed uppercase tracking-widest">Theory</span>
</div>
</div>
<div class="py-md">
<h4 class="font-headline-md text-headline-md text-on-surface mb-xs">The Noir Chronology</h4>
<p class="font-body-md text-body-md text-on-surface-variant mb-md line-clamp-2 opacity-70">An analysis of dark aesthetic preference in precision engineering and its psychological impact on perception.</p>
<div class="flex items-center gap-lg">
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]" data-icon="thumb_up">thumb_up</span>
<span class="font-label-md text-label-md">942</span>
</div>
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]" data-icon="chat_bubble">chat_bubble</span>
<span class="font-label-md text-label-md">156</span>
</div>
</div>
</div>
</div>
<!-- Feed Item: Masterclass 2 -->
<div class="flex flex-col gap-md group md:col-span-2 mt-lg">
<div class="relative bg-surface-container-low aspect-[21/9] overflow-hidden border border-outline-variant">
<img alt="Shadow Masterclass" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" data-alt="A dark and moody mountain landscape under a twilight sky, where the peaks are barely visible silhouettes against a faint gold horizon. The atmosphere is heavy and immersive, using deep blacks and subtle tonal shifts to convey a sense of vast, quiet power. The style is strictly minimalist-noir, focusing on the abstract forms of the natural world." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCc0OFqCSbFxwthUbgLCbSEhmHv1Jmu4R9l1Kt4CQpKhR3989nIMqOfd75f8sVRm9xDBApopE7PQtG80QW4neQSgHXW4DYazM9o7-q2lRioY7i1D-PHh8cwT-aRmMcJrX-V_uv8m7XjdGBRkMu7EQulCqst1fwuxhVA-y4Z41D_M3Hnxyw0tm_3m8ZN3CHHnzkZMTHQX_3M4It87JK9ytA4YOggrfoz-9i2aOE_BXFoWLhSi9aFM6icvih4UY31rkwz4TnHgPXNXuY"/>
<div class="absolute top-md left-md">
<span class="bg-surface-container-highest/80 backdrop-blur px-sm py-xs font-label-sm text-label-sm text-primary-fixed uppercase tracking-widest">Theory</span>
</div>
</div>
<div class="py-md flex flex-col md:flex-row md:justify-between md:items-end">
<div class="md:max-w-xl">
<h4 class="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-sm">Aesthetics of the Abyss</h4>
<p class="font-body-md text-body-md text-on-surface-variant mb-md opacity-70">How minimalist dark-mode interfaces redefine luxury in the digital age by prioritizing focus over ornament.</p>
</div>
<div class="flex items-center gap-lg pb-md">
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]" data-icon="thumb_up">thumb_up</span>
<span class="font-label-md text-label-md">3.4k</span>
</div>
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]" data-icon="chat_bubble">chat_bubble</span>
<span class="font-label-md text-label-md">241</span>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Bottom Navigation Bar - Following Shared Components JSON -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-xl pb-lg pt-md bg-surface-container-lowest/80 backdrop-blur-md border-t border-outline-variant dark:border-outline-variant">
<!-- Analytics/Feed Tab -->
<a class="flex flex-col items-center justify-center text-secondary dark:text-secondary pt-2 hover:text-primary-fixed-dim transition-colors group" href="#">
<span class="material-symbols-outlined active:scale-110 transition-all duration-300" data-icon="analytics">analytics</span>
<span class="font-label-md text-label-md uppercase tracking-widest mt-xs opacity-0 group-hover:opacity-100 transition-opacity">Insight</span>
</a>
<!-- Community Tab (Active) -->
<a class="flex flex-col items-center justify-center text-primary-fixed dark:text-primary-fixed border-t-2 border-primary-fixed -mt-0.5 pt-2 active:scale-110 transition-all duration-300" href="#">
<span class="material-symbols-outlined" data-icon="group" style="font-variation-settings: 'FILL' 1;">group</span>
<span class="font-label-md text-label-md uppercase tracking-widest mt-xs">Community</span>
</a>
<!-- Profile Tab -->
<a class="flex flex-col items-center justify-center text-secondary dark:text-secondary pt-2 hover:text-primary-fixed-dim transition-colors group" href="#">
<span class="material-symbols-outlined active:scale-110 transition-all duration-300" data-icon="person">person</span>
<span class="font-label-md text-label-md uppercase tracking-widest mt-xs opacity-0 group-hover:opacity-100 transition-opacity">Profile</span>
</a>
</nav>
<script>
        // Micro-interaction for feed items
        document.querySelectorAll('.group').forEach(item => {
            item.addEventListener('mouseenter', () => {
                const img = item.querySelector('img');
                if (img) img.style.transform = 'scale(1.05)';
            });
            item.addEventListener('mouseleave', () => {
                const img = item.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
            });
        });

        // Dynamic Active State for Bottom Nav based on content check (though community is hardcoded active here per prompt)
        const navItems = document.querySelectorAll('nav a');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(i => {
                    i.classList.remove('text-primary-fixed', 'dark:text-primary-fixed', 'border-t-2', 'border-primary-fixed', '-mt-0.5');
                    i.classList.add('text-secondary', 'dark:text-secondary');
                });
                item.classList.add('text-primary-fixed', 'dark:text-primary-fixed', 'border-t-2', 'border-primary-fixed', '-mt-0.5');
                item.classList.remove('text-secondary', 'dark:text-secondary');
            });
        });
    </script>
</body></html>

<!-- Your Profile (v2) -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AURA | Julian Thorne Performer Profile</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&amp;family=Sora:wght@600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        body {
            background-color: #121414;
            color: #e2e2e2;
            -webkit-font-smoothing: antialiased;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24;
        }
        .noir-gradient {
            background: linear-gradient(180deg, rgba(18, 20, 20, 0) 0%, rgba(18, 20, 20, 1) 90%);
        }
        .gold-glow:focus {
            outline: none;
            border-color: #ffe16d;
            box-shadow: 0 0 10px rgba(255, 225, 109, 0.2);
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-secondary": "#313030",
                      "surface-tint": "#e9c400",
                      "primary-fixed-dim": "#e9c400",
                      "on-secondary-fixed": "#1c1b1b",
                      "surface-container-highest": "#333535",
                      "primary-fixed": "#ffe16d",
                      "on-background": "#e2e2e2",
                      "inverse-surface": "#e2e2e2",
                      "on-primary-container": "#705e00",
                      "on-tertiary-container": "#605f5e",
                      "on-primary-fixed-variant": "#544600",
                      "tertiary": "#f9f5f5",
                      "on-error": "#690005",
                      "inverse-primary": "#705d00",
                      "error": "#ffb4ab",
                      "surface-dim": "#121414",
                      "tertiary-container": "#dcd9d9",
                      "background": "#121414",
                      "surface-container-high": "#282a2b",
                      "on-tertiary-fixed-variant": "#474746",
                      "on-tertiary-fixed": "#1c1b1b",
                      "surface-container": "#1e2020",
                      "on-tertiary": "#313030",
                      "surface-container-lowest": "#0c0f0f",
                      "error-container": "#93000a",
                      "surface-container-low": "#1a1c1c",
                      "on-primary-fixed": "#221b00",
                      "tertiary-fixed-dim": "#c8c6c5",
                      "secondary-container": "#4a4949",
                      "inverse-on-surface": "#2f3131",
                      "on-primary": "#3a3000",
                      "surface": "#121414",
                      "on-surface": "#e2e2e2",
                      "on-surface-variant": "#d0c6ab",
                      "secondary-fixed-dim": "#c9c6c5",
                      "tertiary-fixed": "#e5e2e1",
                      "surface-bright": "#38393a",
                      "secondary-fixed": "#e5e2e1",
                      "outline": "#999077",
                      "on-error-container": "#ffdad6",
                      "on-secondary-fixed-variant": "#474646",
                      "on-secondary-container": "#bab8b7",
                      "primary": "#fff6df",
                      "outline-variant": "#4d4732",
                      "secondary": "#c9c6c5",
                      "surface-variant": "#333535",
                      "primary-container": "#ffd700"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {
                      "margin-mobile": "20px",
                      "gutter": "24px",
                      "xs": "4px",
                      "unit": "4px",
                      "lg": "32px",
                      "md": "16px",
                      "sm": "8px",
                      "margin-desktop": "80px",
                      "xl": "64px",
                      "xxl": "128px"
              },
              "fontFamily": {
                      "body-md": ["Hanken Grotesk"],
                      "display-lg-mobile": ["Sora"],
                      "headline-xl": ["Sora"],
                      "label-sm": ["Hanken Grotesk"],
                      "label-md": ["Hanken Grotesk"],
                      "headline-xl-mobile": ["Sora"],
                      "display-lg": ["Sora"],
                      "headline-md": ["Sora"],
                      "body-lg": ["Hanken Grotesk"]
              },
              "fontSize": {
                      "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                      "display-lg-mobile": ["40px", {"lineHeight": "1.1", "letterSpacing": "-0.03em", "fontWeight": "700"}],
                      "headline-xl": ["40px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                      "label-sm": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "500"}],
                      "label-md": ["14px", {"lineHeight": "1.2", "letterSpacing": "0.1em", "fontWeight": "600"}],
                      "headline-xl-mobile": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                      "display-lg": ["64px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
                      "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "600"}],
                      "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
              }
            },
          },
        }
      </script>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="font-body-md text-on-background bg-background">
<!-- Top AppBar -->
<header class="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-outline-variant/30 flex justify-between items-center px-margin-mobile py-md">
<button class="hover:opacity-80 transition-opacity active:scale-95 duration-200">
<span class="material-symbols-outlined text-primary-fixed">menu</span>
</button>
<h1 class="font-display-lg-mobile text-[24px] tracking-[0.2em] text-primary-fixed">AURA</h1>
<button class="hover:opacity-80 transition-opacity active:scale-95 duration-200">
<span class="material-symbols-outlined text-primary-fixed">notifications</span>
</button>
</header>
<main class="pb-xxl pt-[72px]">
<!-- Hero Profile Section -->
<section class="relative w-full h-[618px] flex flex-col justify-end overflow-hidden">
<img alt="Julian Thorne" class="absolute inset-0 w-full h-full object-cover grayscale brightness-75 scale-105" data-alt="A cinematic black and white portrait of a male performer with sharp, athletic features and a focused gaze. The lighting is high-contrast chiaroscuro, highlighting the contours of his face against a deep black studio background. The style is avant-garde and expensive, evoking the feeling of a high-fashion editorial. Julian Thorne is presented with immense gravitas and professional poise, reflecting a luxury performance brand identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrp-eiOiJYdv3c2vJoQupUqs_xZgX8UsbtCiWhLED6LA_VBY41O-6nXJSBa4VgYv1EmApkQ5JcBl3KMx4c9EIu4Rque1tiXAXsBf-tJ-mQwUJ_-zH23rD7W2XlqGgBSQ4eEFfdq2XOlGHpkbLLt00LiHIi8BWsotEUSzz_n1uRa7-XYKZlNPUBFrKfpxafswEodWYZyjRUiKbrlvenKsGeP2UxTq8KyHFEU8rTzjLfOktf4DSRFsT5dgCEOzNOcvFybGPsQk7mWE-B"/>
<div class="absolute inset-0 noir-gradient"></div>
<div class="relative px-margin-mobile pb-lg max-w-4xl mx-auto w-full">
<h2 class="font-display-lg-mobile text-white mb-xs">JULIAN THORNE</h2>
<div class="flex gap-md mb-md">
<div class="flex flex-col">
<span class="font-headline-md text-primary-fixed">1.2K</span>
<span class="font-label-sm text-secondary uppercase">Followers</span>
</div>
<div class="w-[1px] h-lg bg-outline-variant"></div>
<div class="flex flex-col">
<span class="font-headline-md text-primary-fixed">24</span>
<span class="font-label-sm text-secondary uppercase">Productions</span>
</div>
</div>
<div class="flex gap-sm">
<button class="flex-1 bg-primary-fixed text-on-primary-fixed font-label-md py-md rounded-DEFAULT uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98]">
                        Follow
                    </button>
<button class="flex-1 border border-secondary text-secondary font-label-md py-md rounded-DEFAULT uppercase tracking-widest hover:bg-white/5 transition-all active:scale-[0.98]">
                        Message
                    </button>
</div>
</div>
</section>
<!-- Personal Quote -->
<section class="px-margin-mobile py-xl bg-surface-container-lowest border-y border-outline-variant/20">
<div class="max-w-4xl mx-auto">
<p class="font-headline-md text-secondary italic text-center leading-relaxed">
                    "Artistry is the bridge between the physical exertion of performance and the ethereal grace of the human spirit."
                </p>
</div>
</section>
<!-- Performance Reel Section (Bento Grid Style) -->
<section class="px-margin-mobile py-xl max-w-6xl mx-auto">
<h3 class="font-label-md text-primary-fixed uppercase tracking-[0.2em] mb-lg text-center">Performance Reel</h3>
<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
<!-- Video Card 1 -->
<div class="group relative aspect-video overflow-hidden rounded-lg bg-surface-container border border-outline-variant/30 hover:border-primary-fixed/50 transition-colors">
<img alt="Nocturnal Ballet" class="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" data-alt="A breathtaking scene from a stage performance titled Nocturnal Ballet, featuring a silhouette of a solo male dancer under a single, sharp spotlight. The atmospheric lighting creates long, dramatic shadows across a dark stage with a slight haze of stage smoke. The mood is mysterious and high-end, utilizing a palette of deep blacks and cool, desaturated blues. The image is crisp and professional, capturing a peak moment of athletic grace." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbMMsJNKpfvaqBzN_0Fe_tHDMKltcx-j8IC7Qswj08M4p384tK-N2V07DMDHqL6e92XlpK-kXMZg7o-bEhAqMvuw6L12OetA08Q9vPSLne4l24Ql0Fzm81Rc2y30jDtqtcR5Y5n57ykGDGt7a4tROCxtIzILgzL1BAG31Uy0XrFgQE8l2u4J7I7DEE_buNH8rlBmxv9xB18bNVN7TGWb3l54-1QJSOEJ4Y2otUvPjhBQ3Bd2FCI-I4znfn7hwr2UlQ6SSjTR9FmyNf"/>
<div class="absolute inset-0 flex flex-col justify-end p-lg bg-gradient-to-t from-background to-transparent">
<span class="font-label-sm text-primary-fixed-dim uppercase mb-xs">Video • 04:12</span>
<h4 class="font-headline-md text-white">Nocturnal Ballet</h4>
</div>
<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
<div class="w-16 h-16 rounded-full border border-primary-fixed flex items-center justify-center bg-background/20 backdrop-blur-sm">
<span class="material-symbols-outlined text-primary-fixed text-[32px]">play_arrow</span>
</div>
</div>
</div>
<!-- Video Card 2 -->
<div class="group relative aspect-video overflow-hidden rounded-lg bg-surface-container border border-outline-variant/30 hover:border-primary-fixed/50 transition-colors">
<img alt="Gilded Silence" class="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" data-alt="An artistic cinematic shot of a theater interior with a focus on gold-leafed architectural details and heavy velvet curtains. The lighting is warm and amber-toned, creating a luxurious and historic performance setting. The composition is asymmetrical and modern, evoking the title Gilded Silence. The overall aesthetic is one of expensive heritage and hushed anticipation, utilizing gold and deep shadows." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOsgUGjDbtmAhtWP7e6r4REjF01p9dwD4e-wdN5hBjYdklUMrDS1V_30ltBXc1B4AwkONISxNlrkLfP8Kzo3tl_Hj9t8sqP2zPciPqZ7DKF3DNXLZJcNi-hNLRiBWuUfjK4HPoPJ8YM1oVF-p4aoYtbb0UR_Q54wJzolX8zi2JKSyTtFWrA9RTotYvZgWT93pBPLPL0Pus3zU-c7c5ky2XhRQ775d_66vvaZDSmhveIu6ORDGWzcfqL1BIJXSKfnh43wJ_c2TRClc-"/>
<div class="absolute inset-0 flex flex-col justify-end p-lg bg-gradient-to-t from-background to-transparent">
<span class="font-label-sm text-primary-fixed-dim uppercase mb-xs">Short Film • 02:45</span>
<h4 class="font-headline-md text-white">Gilded Silence</h4>
</div>
<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
<div class="w-16 h-16 rounded-full border border-primary-fixed flex items-center justify-center bg-background/20 backdrop-blur-sm">
<span class="material-symbols-outlined text-primary-fixed text-[32px]">play_arrow</span>
</div>
</div>
</div>
</div>
</section>
<!-- Honors & Accolades -->
<section class="px-margin-mobile py-xl bg-surface-container-low">
<div class="max-w-4xl mx-auto">
<h3 class="font-label-md text-primary-fixed uppercase tracking-[0.2em] mb-xl text-center">Honors &amp; Accolades</h3>
<div class="space-y-md">
<div class="flex items-center justify-between p-lg border-b border-outline-variant/30 group hover:bg-surface-container-high transition-colors">
<div>
<span class="font-label-sm text-secondary uppercase tracking-widest">2023</span>
<p class="font-headline-md text-on-surface">Vanguard Performance Prize</p>
</div>
<span class="material-symbols-outlined text-primary-fixed group-hover:translate-x-2 transition-transform">arrow_forward</span>
</div>
<div class="flex items-center justify-between p-lg border-b border-outline-variant/30 group hover:bg-surface-container-high transition-colors">
<div>
<span class="font-label-sm text-secondary uppercase tracking-widest">2022</span>
<p class="font-headline-md text-on-surface">Global Arts Guild Fellowship</p>
</div>
<span class="material-symbols-outlined text-primary-fixed group-hover:translate-x-2 transition-transform">arrow_forward</span>
</div>
<div class="flex items-center justify-between p-lg border-b border-outline-variant/30 group hover:bg-surface-container-high transition-colors">
<div>
<span class="font-label-sm text-secondary uppercase tracking-widest">2021</span>
<p class="font-headline-md text-on-surface">Emerging Artist of the Year</p>
</div>
<span class="material-symbols-outlined text-primary-fixed group-hover:translate-x-2 transition-transform">arrow_forward</span>
</div>
</div>
</div>
</section>
</main>
<!-- Bottom Navigation Bar -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-xl pb-lg pt-md bg-surface-container-lowest/80 backdrop-blur-md border-t border-outline-variant dark:border-outline-variant">
<a class="flex flex-col items-center justify-center text-secondary dark:text-secondary pt-2 hover:text-primary-fixed-dim transition-colors group" href="#">
<span class="material-symbols-outlined group-active:scale-110 transition-all duration-300">analytics</span>
</a>
<a class="flex flex-col items-center justify-center text-secondary dark:text-secondary pt-2 hover:text-primary-fixed-dim transition-colors group" href="#">
<span class="material-symbols-outlined group-active:scale-110 transition-all duration-300">group</span>
</a>
<a class="flex flex-col items-center justify-center text-primary-fixed dark:text-primary-fixed border-t-2 border-primary-fixed -mt-0.5 pt-2 group" href="#">
<span class="material-symbols-outlined group-active:scale-110 transition-all duration-300" style="font-variation-settings: 'FILL' 1;">person</span>
</a>
</nav>
<script>
        // Micro-interaction for scroll effects
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY;
            const heroImg = document.querySelector('section.relative img');
            if (heroImg) {
                heroImg.style.transform = `scale(${1.05 + scrollPos * 0.0001}) translateY(${scrollPos * 0.2}px)`;
            }
        });
    </script>
</body></html>