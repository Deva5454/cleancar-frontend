/**
 * buypage_theme.ts
 * Design tokens for the /buy page — matched to mtechnosoft.wixstudio.com/car-washing
 * Import and use these wherever you render customer-facing pages.
 *
 * Usage:
 *   import { T } from './buypage_theme';
 *   <div style={{ background: T.nav.bg, color: T.nav.text }}>…</div>
 */

export const T = {

  // ── FONT FAMILIES ──────────────────────────────────────────────────────────
  // Add to public/index.html or <link> in component:
  // https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800
  //   &family=Inter:wght@300;400;500;600&display=swap
  font: {
    heading: "'Poppins', sans-serif",   // Headings, plan names, prices, brand
    body:    "'Inter', sans-serif",     // Body text, labels, inputs, buttons
  },

  // ── NAV ────────────────────────────────────────────────────────────────────
  // Dark navy — matches website header exactly
  nav: {
    bg:          '#0F172A',
    border:      'rgba(255,255,255,0.08)',
    logoText:    '#FFFFFF',
    logoSub:     'rgba(255,255,255,0.70)',
    phoneText:   'rgba(255,255,255,0.65)',
    logoImgUrl:  'https://static.wixstatic.com/media/4ae675_97649704bfbd4ba2ab332717a5a9d96e~mv2.png',
  },

  // ── HERO ───────────────────────────────────────────────────────────────────
  // Deep navy with car wash photo overlay at 12% opacity
  hero: {
    bgGradient:   'linear-gradient(160deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
    photoUrl:     'https://static.wixstatic.com/media/4ae675_a44950b3d59245f3b09dd9f9bd21a1d6~mv2.jpg/v1/fill/w_1440,h_600,al_c,q_85/hero.jpg',
    photoOpacity: 0.12,
    headlineText: '#FFFFFF',
    accentText:   '#FBBF24',   // Yellow — "every single day." & badge text
    bodyText:     'rgba(255,255,255,0.80)',
    trustText:    'rgba(255,255,255,0.75)',
    badgeBg:      'rgba(255,255,255,0.10)',
    badgeBorder:  'rgba(255,255,255,0.20)',
    badgeText:    '#FBBF24',
  },

  // ── PAGE CONTENT ───────────────────────────────────────────────────────────
  page: {
    bg:           '#FFFFFF',
    textPrimary:  '#111827',
    textSecond:   '#6B7280',
    textMuted:    '#9CA3AF',
    textHint:     '#CBD5E1',
    border:       '#E5E7EB',
    borderLight:  '#F3F4F6',
    surfaceLight: '#F9FAFB',
    surfaceMid:   '#F1F5F9',
  },

  // ── INTERACTIVE (CTAs, active states, selected cards) ──────────────────────
  // Dark navy for primary — matches website's dark CTA buttons
  action: {
    primary:         '#0F172A',   // Primary CTA background
    primaryText:     '#FFFFFF',
    primaryHover:    '#1E293B',
    primaryDisabled: '#D1D5DB',
    activeCard:      '#F8FAFC',   // Selected card background
    activeBorder:    '#0F172A',   // Selected card border
    stepActive:      '#0F172A',   // Active step circle + underline
    stepDone:        '#16A34A',   // Completed step circle
    stepPending:     '#E2E8F0',   // Upcoming step circle
  },

  // ── TRUST STRIP ────────────────────────────────────────────────────────────
  // Same dark as nav — wraps the page top+bottom
  strip: {
    bg:   '#0F172A',
    text: 'rgba(255,255,255,0.75)',
  },

  // ── STATUS COLORS ──────────────────────────────────────────────────────────
  status: {
    successBg:    '#F0FDF4',
    successBorder:'#BBF7D0',
    successText:  '#15803D',
    warningBg:    '#FFF7ED',
    warningBorder:'#FED7AA',
    warningText:  '#C2410C',
    infoBg:       '#F9FAFB',
    infoBorder:   '#E2E8F0',
    infoText:     '#334155',
    errorBg:      '#FEF2F2',
    errorBorder:  '#FECACA',
    errorText:    '#DC2626',
  },

  // ── INVOICE / ORDER SUMMARY ────────────────────────────────────────────────
  invoice: {
    headerBg:     'linear-gradient(135deg,#0F172A,#1E3A5F)',
    headerText:   '#FFFFFF',
    numberText:   '#FBBF24',
    summaryBar:   '#0F172A',    // "Amount to pay" section background
    amountText:   '#FBBF24',   // Amount number on dark bg
    labelText:    '#FFFFFF',   // "Amount to pay" label on dark bg
  },

} as const;

// ── HELPER: box shadow tokens ─────────────────────────────────────────────────
export const shadow = {
  card:     '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)',
  cardHover:'0 4px 20px rgba(15,23,42,0.12)',
  selected: '0 4px 20px rgba(15,23,42,0.12)',
  payBtn:   '0 4px 20px rgba(15,23,42,0.30)',
} as const;

// ── HELPER: border-radius tokens ─────────────────────────────────────────────
export const radius = {
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  pill: '50px',
} as const;
