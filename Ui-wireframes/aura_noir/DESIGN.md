---
name: Aura Noir
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#d0c6ab'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#999077'
  outline-variant: '#4d4732'
  surface-tint: '#e9c400'
  primary: '#fff6df'
  on-primary: '#3a3000'
  primary-container: '#ffd700'
  on-primary-container: '#705e00'
  inverse-primary: '#705d00'
  secondary: '#c9c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#f9f5f5'
  on-tertiary: '#313030'
  tertiary-container: '#dcd9d9'
  on-tertiary-container: '#605f5e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe16d'
  primary-fixed-dim: '#e9c400'
  on-primary-fixed: '#221b00'
  on-primary-fixed-variant: '#544600'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c9c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474746'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  xxl: 128px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 80px
---

## Brand & Style

The design system embodies a high-fashion, avant-garde aesthetic tailored for premium performance and luxury lifestyle brands. It aims to evoke feelings of exclusivity, precision, and power through a "Noir" lens. The target audience includes high-net-worth individuals and enthusiasts who appreciate minimalist sophistication over traditional ornamentation.

The style is **Minimalist-Noir**. It leverages heavy whitespace (or "blackspace"), high-contrast typography, and a "Performance Gold" accent to signify quality. The interface should feel like a digital gallery: sparse, intentional, and expensive. It avoids the "cheap" luxury look by eschewing excessive gradients and complex textures in favor of flat, high-quality finishes and razor-sharp structural alignment.

## Colors

This design system uses a strictly dark-mode-first approach to reinforce the "Noir" narrative.

*   **Primary (Performance Gold):** `#ffd700`. Used sparingly for high-value CTAs, status indicators, and critical highlights.
*   **Secondary (Pitch Black):** `#0a0a0a`. The foundational surface color for the entire application.
*   **Tertiary (Raised Black):** `#1a1a1a`. Used for cards, containers, and secondary UI elements to provide subtle depth against the pitch-black background.
*   **Neutral (Off-White):** `#f5f5f5`. Used for primary text and icons to ensure maximum readability against dark surfaces.

Avoid using pure `#000000` to prevent OLED smearing; the `#0a0a0a` base provides a more premium, velvet-like visual quality.

## Typography

The typography system transitions from the previous decorative serif to **Sora**, a geometric sans-serif with a technical yet luxury feel. This shift eliminates "cheap" luxury associations, opting for a contemporary, architectural vibe.

**Sora** is reserved for headlines and display text, utilizing tight letter-spacing and bold weights to command attention. **Hanken Grotesk** handles all functional and body text, chosen for its sharp clarity and neutral, professional tone. 

For labels and small UI hints, use uppercase Hanken Grotesk with expanded letter-spacing (`0.1em`) to create a "branded" editorial look.

## Layout & Spacing

This design system employs a strict 4px/8px grid system with an emphasis on "larger breathers." Luxury is defined by the space *between* elements.

*   **Grid:** A 12-column fluid grid for desktop and a 4-column grid for mobile.
*   **Section Spacing:** Use `xl` (64px) or `xxl` (128px) between major content sections to prevent visual clutter and enforce the minimalist narrative.
*   **Intentionality:** Small components (like buttons or input fields) should be surrounded by generous padding. Never crowd text against edges.

The layout should feel "airy" despite the dark palette. On mobile, maintain a minimum of 20px side margins to ensure the content feels framed.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layers** and **Low-Contrast Outlines**.

*   **Tiers:** The background is `#0a0a0a`. Interactive cards or secondary regions use `#1a1a1a`. 
*   **Outlines:** Avoid heavy drop shadows. Instead, use thin (1px) outlines in `#2a2a2a` or a very low-opacity Performance Gold (`rgba(255, 215, 0, 0.15)`) for active states.
*   **Active States:** When an element is focused or elevated, use a subtle inner glow or a 1px Performance Gold border rather than a shadow to maintain a flat, architectural feel.

## Shapes

The shape language is **Soft (0.25rem)**. 

While the design is modern, it avoids the "bubbly" feel of fully rounded corners. The slight radius (4px) softens the aggressive noir palette just enough to feel engineered and precise, rather than harsh or brutalist. Buttons, input fields, and cards all follow this consistent 4px radius.

## Components

### 3-Button Navigation
The core navigation is a bottom-fixed or center-aligned floating bar containing exactly three points of interaction. Icons must be minimal (2px stroke weight) and unlabelled. The center button is the primary action, often styled with a subtle Performance Gold border.

### Buttons
*   **Primary:** Solid Performance Gold with Black text. 4px radius. 
*   **Secondary:** Outlined (1px white or grey) with white text.
*   **Ghost:** Text-only, uppercase, with 0.1em letter spacing.

### Input Fields
Inputs should be minimalist: a bottom border only (1px `#2a2a2a`) that transitions to Performance Gold on focus. Placeholders are in a muted grey.

### Cards
Cards use the Tertiary color (`#1a1a1a`) with no shadow. Use generous internal padding (`32px`) to ensure content within the card has room to breathe.

### Chips/Tags
Small, rectangular containers with the `label-sm` typography style. Used for categorizing performance metrics or luxury features.