/**
 * Snout Stack Design Tokens
 * High-fidelity design system tokens extracted from the Snout Stack design handoff
 * All colors, typography, spacing, shadows, and animations defined here
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary palette
  ink: '#18181b',        // Primary text
  ink2: '#52525b',       // Secondary text, inactive icons
  paper: '#fafaf7',      // Cards, surfaces, tab bar bg
  line: '#e5e5e0',       // Hairline borders
  acc: '#d97757',        // Accent - Boop button, active states, kicker

  // Derived/semantic
  accentChip: 'rgba(217, 119, 87, 0.12)',     // Accent chip background
  accentQuote: 'rgba(217, 119, 87, 0.08)',    // Quote block background
  accentShadow: 'rgba(217, 119, 87, 0.45)',   // Boop shadow

  // Background
  appBg: '#efece5',  // Screen base
  bgWashTopLeft: 'radial-gradient(circle at 20% 20%, rgba(217, 119, 87, 0.08), transparent 50%)',
  bgWashBottomRight: 'radial-gradient(circle at 80% 80%, rgba(90, 122, 154, 0.06), transparent 50%)',

  // Semantic
  inkBlue: '#5a7a9a',  // Future secondary accent
}

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  families: {
    inter: 'Inter, system-ui, -apple-system, sans-serif',
    serif: '"Instrument Serif", Georgia, serif',
  },

  // Scale (size, weight, line-height)
  // Display text (Instrument Serif italic)
  display: {
    title: { size: '28px', weight: 400, lineHeight: 1, family: 'serif', style: 'italic' },
    handle: { size: '32px', weight: 400, lineHeight: 1, family: 'serif', style: 'italic', letterSpacing: '-0.5px' },
    counter: { size: '18px', weight: 400, lineHeight: 1, family: 'serif' },
  },

  // Body text (Inter)
  body: {
    lg: { size: '14px', weight: 400, lineHeight: 1.5 },
    base: { size: '13.5px', weight: 400, lineHeight: 1.4 },
    sm: { size: '11.5px', weight: 400, lineHeight: 1.3 },
    xs: { size: '10.5px', weight: 400, lineHeight: 1 },
  },

  // Labels & UI
  ui: {
    kicker: { size: '11px', weight: 700, lineHeight: 1, letterSpacing: '2.5px', textTransform: 'uppercase' },
    label: { size: '10.5px', weight: 600, lineHeight: 1, letterSpacing: '0.6px' },
    chip: { size: '10.5px', weight: 600, lineHeight: 1 },
    button: { size: '12.5px', weight: 600, lineHeight: 1 },
    buttonSmall: { size: '10.5px', weight: 800, lineHeight: 1, letterSpacing: '0.5px' },
  },

  // Utility
  italic: { style: 'italic' },
}

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  1: '4px',
  2: '6px',
  3: '8px',
  4: '10px',
  5: '12px',
  6: '14px',
  7: '16px',
  8: '18px',
  9: '22px',
  10: '26px',
  11: '28px',
}

// ============================================================================
// RADII
// ============================================================================

export const radii = {
  sm: '12px',      // Quote block, counter tiles
  md: '22px',      // Back peek cards
  lg: '24px',      // Active card
  xl: '14px',      // Action buttons in Burst
  pill: '999px',   // Chips, circular buttons
}

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  card: '0 24px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.06)',
  boop: '0 10px 24px rgba(217, 119, 87, 0.45)',
  sm: '0 6px 16px rgba(0, 0, 0, 0.04)',
}

// ============================================================================
// MOTION/ANIMATIONS
// ============================================================================

export const motion = {
  boopPulse: {
    duration: '2.2s',
    timing: 'ease-out',
    keyframes: {
      from: { ringRadius: '0px', opacity: 0.4 },
      to: { ringRadius: '14px', opacity: 0 },
    },
  },
  boopPress: {
    duration: '150ms',
    timing: 'ease',
    scale: { from: 1, to: 0.92 },
  },
  cardSpring: {
    duration: '350ms',
    timing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring physics
  },
}

// ============================================================================
// COMPONENT-SPECIFIC VALUES
// ============================================================================

export const components = {
  // Stack screen
  stack: {
    header: {
      topPadding: spacing[7],
      horizontalPadding: spacing[8],
    },
    cardStack: {
      margins: `4px ${spacing[6]}px 0`,
      height: '590px',
    },
    boopButton: {
      size: '70px',
      position: { top: '332px', right: '-4px' },
      rotation: '-8deg',
      borderWidth: '4px',
    },
    gestureHints: {
      margins: `4px ${spacing[6]}px 0`,
    },
    countersStrip: {
      margins: `${spacing[5]} ${spacing[8]} 0`,
    },
    tabBar: {
      height: '82px',
      topPadding: spacing[3],
      bottomPadding: spacing[6],
      background: 'rgba(250, 250, 247, 0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
    },
  },

  // Dex screen
  dex: {
    header: {
      topPadding: spacing[8],
      horizontalPadding: spacing[4],
    },
    speciesChips: {
      gap: spacing[2],
      horizontalPad: spacing[4],
    },
    breedCard: {
      aspectRatio: '5/4',
    },
  },

  // Burst screen (dark mode)
  burst: {
    background: '#0a0a0a',
    heroHeight: '62%',
    filmstripHeight: '90px',
    actionButtonSize: '44px',
    actionButtonRadius: '14px',
  },

  // Shelf screen
  shelf: {
    heroHeight: '260px',
    contentTop: '220px',
    cardRadius: '24px',
  },
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

export const getCSSVariable = (token: keyof typeof colors | keyof typeof spacing | keyof typeof radii) => {
  return `var(--${token})`
}

export const generateCSSVariables = () => {
  const vars = new Map<string, string>()

  // Colors
  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === 'string' && !value.includes('gradient') && !value.includes('rgba')) {
      vars.set(`--${key}`, value)
    }
  })

  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    vars.set(`--space-${key}`, value)
  })

  // Radii
  Object.entries(radii).forEach(([key, value]) => {
    vars.set(`--radius-${key}`, value)
  })

  return vars
}
