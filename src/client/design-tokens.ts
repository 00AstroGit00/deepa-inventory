/**
 * Deepa Inventory - Design Token System
 * Android-first, shopping-app-inspired visual language
 * All tokens use CSS custom properties for runtime theming
 */

// ============================================
// COLOR PALETTE - Semantic Color System
// ============================================

export const colorTokens = {
  // Background layers
  bg: {
    primary: '#0a0f1a',        // Deep navy - main background
    secondary: '#111827',      // Elevated surfaces
    tertiary: '#1f2937',       // Cards, sheets
    inverse: '#f8fafc',        // Light mode background
  },

  // Surface layers
  surface: {
    primary: '#111827',        // Main surface
    elevated: '#1f2937',       // Elevated cards, modals
    hover: '#273449',          // Hover state
    active: '#314159',         // Active/pressed state
    muted: '#111827',          // Subtle backgrounds
    overlay: 'rgba(0, 0, 0, 0.6)', // Modal backdrop
  },

  // Text colors
  text: {
    primary: '#f1f5f9',        // Primary text
    secondary: '#cbd5e1',      // Secondary text
    tertiary: '#94a3b8',       // Tertiary/muted text
    quaternary: '#64748b',     // Disabled/placeholder
    inverse: '#0a0f1a',        // Text on light surfaces
    onBrand: '#ffffff',        // Text on brand colors
  },

  // Border colors
  border: {
    light: '#1f2937',          // Subtle borders
    default: '#334155',        // Standard borders
    strong: '#475569',         // Emphasis borders
    focus: '#3b82f6',          // Focus ring
    error: '#ef4444',          // Error borders
  },

  // Brand colors - Deepa Blue
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',            // Primary brand
    600: '#2563eb',            // Primary brand hover
    700: '#1d4ed8',            // Primary brand active
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Semantic status colors
  status: {
    success: {
      light: '#064e3b',
      main: '#10b981',
      dark: '#047857',
      on: '#ffffff',
      bg: '#064e3b',
    },
    warning: {
      light: '#78350f',
      main: '#f59e0b',
      dark: '#b45309',
      on: '#0a0f1a',
      bg: '#78350f',
    },
    danger: {
      light: '#7f1d1d',
      main: '#ef4444',
      dark: '#dc2626',
      on: '#ffffff',
      bg: '#7f1d1d',
    },
    info: {
      light: '#1e3a8a',
      main: '#3b82f6',
      dark: '#2563eb',
      on: '#ffffff',
      bg: '#1e3a8a',
    },
  },

  // Inventory-specific status colors
  inventory: {
    inStock: '#10b981',        // Green - good stock
    lowStock: '#f59e0b',       // Amber - low stock
    criticalStock: '#ef4444',  // Red - critical
    outOfStock: '#ef4444',     // Red - out of stock
    pending: '#3b82f6',        // Blue - pending sync
    variance: '#f97316',       // Orange - variance
    normal: '#94a3b8',         // Gray - normal
  },

  // Category accent colors (subtle, for category chips)
  category: {
    liquor: '#f59e0b',         // Amber/gold
    beer: '#8b5cf6',           // Purple
    soda: '#06b6d4',           // Cyan
    club_soda: '#10b981',      // Emerald
    water: '#3b82f6',          // Blue
    other: '#94a3b8',          // Slate
  },
} as const;

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================

export const typographyTokens = {
  // Font families
  fontFamily: {
    sans: '"Inter", "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    display: '"Inter", system-ui, sans-serif',
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Font sizes (rem-based, mobile-first)
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.8125rem',    // 13px
    base: '0.875rem',   // 14px
    lg: '1rem',         // 16px
    xl: '1.125rem',     // 18px
    '2xl': '1.25rem',   // 20px
    '3xl': '1.5rem',    // 24px
    '4xl': '1.875rem',  // 30px
    '5xl': '2.25rem',   // 36px
  },

  // Line heights
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.04em',
  },

  // Typography scale - semantic usage
  scale: {
    // Display / Page titles
    displayLarge: { size: '2.25rem', weight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' },
    displayMedium: { size: '1.875rem', weight: 700, lineHeight: 1.1, letterSpacing: '-0.02em' },
    displaySmall: { size: '1.5rem', weight: 600, lineHeight: 1.25, letterSpacing: '-0.01em' },

    // Headlines
    headlineLarge: { size: '1.25rem', weight: 600, lineHeight: 1.3, letterSpacing: '0' },
    headlineMedium: { size: '1.125rem', weight: 600, lineHeight: 1.3, letterSpacing: '0' },
    headlineSmall: { size: '1rem', weight: 600, lineHeight: 1.4, letterSpacing: '0' },

    // Titles
    titleLarge: { size: '1rem', weight: 600, lineHeight: 1.5, letterSpacing: '0.01em' },
    titleMedium: { size: '0.875rem', weight: 600, lineHeight: 1.5, letterSpacing: '0.01em' },
    titleSmall: { size: '0.8125rem', weight: 600, lineHeight: 1.5, letterSpacing: '0.01em' },

    // Body text
    bodyLarge: { size: '1rem', weight: 400, lineHeight: 1.6, letterSpacing: '0' },
    bodyMedium: { size: '0.875rem', weight: 400, lineHeight: 1.6, letterSpacing: '0' },
    bodySmall: { size: '0.8125rem', weight: 400, lineHeight: 1.5, letterSpacing: '0' },

    // Labels / UI text
    labelLarge: { size: '0.875rem', weight: 500, lineHeight: 1.5, letterSpacing: '0.01em' },
    labelMedium: { size: '0.8125rem', weight: 500, lineHeight: 1.5, letterSpacing: '0.01em' },
    labelSmall: { size: '0.75rem', weight: 500, lineHeight: 1.5, letterSpacing: '0.02em' },

    // Numeric / Data
    dataLarge: { size: '1.5rem', weight: 700, lineHeight: 1.2, letterSpacing: '0', fontFamily: 'mono' },
    dataMedium: { size: '1.125rem', weight: 600, lineHeight: 1.3, letterSpacing: '0', fontFamily: 'mono' },
    dataSmall: { size: '0.875rem', weight: 600, lineHeight: 1.4, letterSpacing: '0', fontFamily: 'mono' },
  },
} as const;

// ============================================
// SPACING SYSTEM (8px base grid)
// ============================================

export const spacingTokens = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px

  // Semantic spacing
  pageGutter: '1rem',        // 16px - page horizontal padding
  pageGutterWide: '1.5rem',  // 24px - tablet/desktop
  cardPadding: '1rem',       // 16px - card internal padding
  cardPaddingSm: '0.75rem',  // 12px - compact card padding
  sectionGap: '1.5rem',      // 24px - between sections
  componentGap: '1rem',      // 16px - between components
  inlineGap: '0.5rem',       // 8px - inline elements
  inlineGapSm: '0.375rem',   // 6px - tight inline
  inlineGapLg: '0.75rem',    // 12px - loose inline
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const radiusTokens = {
  none: '0',
  xs: '0.125rem',    // 2px
  sm: '0.25rem',     // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const;

// ============================================
// ELEVATION / SHADOWS
// ============================================

export const elevationTokens = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.4)',
} as const;

// ============================================
// ICON SIZES
// ============================================

export const iconSizeTokens = {
  xs: '0.875rem',    // 14px
  sm: '1rem',        // 16px
  md: '1.25rem',     // 20px
  lg: '1.5rem',      // 24px
  xl: '1.875rem',    // 30px
  '2xl': '2.25rem',  // 36px
  '3xl': '3rem',     // 48px
} as const;

// ============================================
// CONTROL DIMENSIONS
// ============================================

export const controlTokens = {
  // Heights (touch targets minimum 44px / 2.75rem)
  height: {
    xs: '2rem',        // 32px - compact
    sm: '2.25rem',     // 36px - small
    md: '2.75rem',     // 44px - standard (min touch target)
    lg: '3rem',        // 48px - large
    xl: '3.5rem',      // 56px - extra large
  },

  // Padding
  paddingX: {
    xs: '0.5rem',      // 8px
    sm: '0.75rem',     // 12px
    md: '1rem',        // 16px
    lg: '1.25rem',     // 20px
    xl: '1.5rem',      // 24px
  },

  // Input padding
  inputPaddingY: '0.625rem',  // 10px
  inputPaddingX: '0.875rem',  // 14px
} as const;

// ============================================
// GRID / LAYOUT
// ============================================

export const layoutTokens = {
  // Breakpoints (mobile-first)
  breakpoint: {
    xs: '320px',
    sm: '375px',
    md: '412px',
    lg: '600px',
    xl: '768px',
    '2xl': '1024px',
    '3xl': '1280px',
    '4xl': '1440px',
  },

  // Container max widths
  container: {
    sm: '384px',
    md: '512px',
    lg: '768px',
    xl: '1024px',
    '2xl': '1280px',
    full: '100%',
  },

  // Product grid
  productGrid: {
    mobileMinWidth: '150px',    // Min card width on mobile
    tabletMinWidth: '170px',    // Min card width on tablet
    desktopMinWidth: '180px',   // Min card width on desktop
    gap: '0.75rem',             // Grid gap
    gapSm: '0.5rem',            // Compact grid gap
  },

  // Header height
  headerHeight: '3.5rem',       // 56px - standard Android toolbar
  headerHeightCompact: '3rem',  // 48px - compact

  // Bottom nav height
  bottomNavHeight: '3.5rem',    // 56px
  bottomNavHeightLandscape: '3rem', // 48px

  // Safe area
  safeAreaBottom: 'env(safe-area-inset-bottom)',
  safeAreaTop: 'env(safe-area-inset-top)',
} as const;

// ============================================
// ANIMATION / TRANSITION
// ============================================

export const animationTokens = {
  duration: {
    instant: '0ms',
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Material Design standard
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerated: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerated: 'cubic-bezier(0.4, 0, 1, 1)',
  },

  // Spring animations (for React Spring / Framer Motion)
  spring: {
    gentle: { tension: 120, friction: 14 },
    wobbly: { tension: 180, friction: 12 },
    stiff: { tension: 210, friction: 20 },
    slow: { tension: 280, friction: 60 },
  },
} as const;

// ============================================
// Z-INDEX LAYERS
// ============================================

export const zIndexTokens = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const;

// ============================================
// EXPORT ALL TOKENS
// ============================================

export const designTokens = {
  color: colorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  radius: radiusTokens,
  elevation: elevationTokens,
  iconSize: iconSizeTokens,
  control: controlTokens,
  layout: layoutTokens,
  animation: animationTokens,
  zIndex: zIndexTokens,
} as const;

export type DesignTokens = typeof designTokens;

// ============================================
// CSS CUSTOM PROPERTY GENERATOR
// ============================================

export function generateCSSVariables(): string {
  const lines: string[] = [' :root {'];

  // Colors
  Object.entries(colorTokens.bg).forEach(([key, value]) => {
    lines.push(`  --bg-${key}: ${value};`);
  });
  Object.entries(colorTokens.surface).forEach(([key, value]) => {
    lines.push(`  --surface-${key}: ${value};`);
  });
  Object.entries(colorTokens.text).forEach(([key, value]) => {
    lines.push(`  --text-${key}: ${value};`);
  });
  Object.entries(colorTokens.border).forEach(([key, value]) => {
    lines.push(`  --border-${key}: ${value};`);
  });
  Object.entries(colorTokens.brand).forEach(([key, value]) => {
    lines.push(`  --brand-${key}: ${value};`);
  });
  Object.entries(colorTokens.status).forEach(([category, shades]) => {
    Object.entries(shades).forEach(([key, value]) => {
      lines.push(`  --${category}-${key}: ${value};`);
    });
  });
  Object.entries(colorTokens.inventory).forEach(([key, value]) => {
    lines.push(`  --inv-${key}: ${value};`);
  });
  Object.entries(colorTokens.category).forEach(([key, value]) => {
    lines.push(`  --cat-${key}: ${value};`);
  });

  // Typography
  Object.entries(typographyTokens.fontFamily).forEach(([key, value]) => {
    lines.push(`  --font-${key}: ${value};`);
  });
  Object.entries(typographyTokens.fontWeight).forEach(([key, value]) => {
    lines.push(`  --font-weight-${key}: ${value};`);
  });
  Object.entries(typographyTokens.fontSize).forEach(([key, value]) => {
    lines.push(`  --text-${key}: ${value};`);
  });
  Object.entries(typographyTokens.lineHeight).forEach(([key, value]) => {
    lines.push(`  --leading-${key}: ${value};`);
  });

  // Spacing
  Object.entries(spacingTokens).forEach(([key, value]) => {
    if (typeof value === 'string' && value.endsWith('rem')) {
      lines.push(`  --space-${key}: ${value};`);
    }
  });

  // Radius
  Object.entries(radiusTokens).forEach(([key, value]) => {
    lines.push(`  --radius-${key}: ${value};`);
  });

  // Elevation
  Object.entries(elevationTokens).forEach(([key, value]) => {
    lines.push(`  --shadow-${key}: ${value};`);
  });

  // Control heights
  Object.entries(controlTokens.height).forEach(([key, value]) => {
    lines.push(`  --control-height-${key}: ${value};`);
  });
  Object.entries(controlTokens.paddingX).forEach(([key, value]) => {
    lines.push(`  --control-px-${key}: ${value};`);
  });
  lines.push(`  --input-py: ${controlTokens.inputPaddingY};`);
  lines.push(`  --input-px: ${controlTokens.inputPaddingX};`);

  // Layout
  Object.entries(layoutTokens.breakpoint).forEach(([key, value]) => {
    lines.push(`  --bp-${key}: ${value};`);
  });
  lines.push(`  --header-height: ${layoutTokens.headerHeight};`);
  lines.push(`  --header-height-compact: ${layoutTokens.headerHeightCompact};`);
  lines.push(`  --bottom-nav-height: ${layoutTokens.bottomNavHeight};`);
  lines.push(`  --bottom-nav-height-landscape: ${layoutTokens.bottomNavHeightLandscape};`);
  lines.push(`  --safe-bottom: ${layoutTokens.safeAreaBottom};`);
  lines.push(`  --safe-top: ${layoutTokens.safeAreaTop};`);

  // Animation
  Object.entries(animationTokens.duration).forEach(([key, value]) => {
    lines.push(`  --duration-${key}: ${value};`);
  });
  Object.entries(animationTokens.easing).forEach(([key, value]) => {
    lines.push(`  --ease-${key}: ${value};`);
  });

  // Z-index
  Object.entries(zIndexTokens).forEach(([key, value]) => {
    lines.push(`  --z-${key}: ${value};`);
  });

  lines.push('}');
  return lines.join('\n');
}

// ============================================
// LIGHT THEME OVERRIDES
// ============================================

export const lightThemeOverrides = `
[data-theme="light"] {
  /* Backgrounds */
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --bg-inverse: #0a0f1a;

  /* Surfaces */
  --surface-primary: #ffffff;
  --surface-elevated: #ffffff;
  --surface-hover: #f1f5f9;
  --surface-active: #e2e8f0;
  --surface-muted: #f8fafc;
  --surface-overlay: rgba(0, 0, 0, 0.4);

  /* Text */
  --text-primary: #0a0f1a;
  --text-secondary: #334155;
  --text-tertiary: #64748b;
  --text-quaternary: #94a3b8;
  --text-inverse: #f8fafc;
  --text-on-brand: #ffffff;

  /* Borders */
  --border-light: #e2e8f0;
  --border-default: #cbd5e1;
  --border-strong: #94a3b8;
  --border-focus: #2563eb;
  --border-error: #dc2626;

  /* Status colors - lighter backgrounds */
  --success-bg: #d1fae5;
  --success-main: #059669;
  --success-on: #064e3b;

  --warning-bg: #fef3c7;
  --warning-main: #d97706;
  --warning-on: #78350f;

  --danger-bg: #fee2e2;
  --danger-main: #dc2626;
  --danger-on: #7f1d1d;

  --info-bg: #dbeafe;
  --info-main: #2563eb;
  --info-on: #1e3a8a;

  /* Inventory status */
  --inv-in-stock: #059669;
  --inv-low-stock: #d97706;
  --inv-critical-stock: #dc2626;
  --inv-out-of-stock: #dc2626;
  --inv-pending: #2563eb;
  --inv-variance: #ea580c;
  --inv-normal: #64748b;
}`;

// ============================================
// COMPONENT-SPECIFIC TOKEN OVERRIDES
// ============================================

export const componentTokens = {
  // Product Card
  productCard: {
    padding: spacingTokens.cardPadding,
    paddingSm: spacingTokens.cardPaddingSm,
    gap: spacingTokens.inlineGap,
    radius: radiusTokens.xl,
    border: '1px solid var(--border-default)',
    background: 'var(--surface-primary)',
    hoverBackground: 'var(--surface-hover)',
    activeBackground: 'var(--surface-active)',
    elevation: elevationTokens.sm,
    hoverElevation: elevationTokens.md,
    imageHeight: '8rem',        // 128px
    imageHeightCompact: '6rem', // 96px
    minWidth: layoutTokens.productGrid.mobileMinWidth,
    maxWidth: '100%',
  },

  // Category Chip
  categoryChip: {
    height: '2.25rem',          // 36px
    paddingX: '0.875rem',       // 14px
    gap: '0.375rem',            // 6px
    radius: radiusTokens.full,
    fontSize: typographyTokens.fontSize.sm,
    fontWeight: typographyTokens.fontWeight.medium,
    selectedBg: 'var(--brand-600)',
    selectedColor: 'var(--text-on-brand)',
    unselectedBg: 'var(--surface-elevated)',
    unselectedColor: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
  },

  // Search Bar
  searchBar: {
    height: '2.75rem',          // 44px
    paddingX: '1rem',           // 16px
    paddingLeftIcon: '2.75rem', // Space for leading icon
    radius: radiusTokens.xl,
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border-default)',
    focusBorder: 'var(--border-focus)',
    placeholderColor: 'var(--text-quaternary)',
    iconSize: iconSizeTokens.md,
    iconColor: 'var(--text-tertiary)',
  },

  // Bottom Navigation
  bottomNav: {
    height: layoutTokens.bottomNavHeight,
    paddingBottom: 'env(safe-area-inset-bottom)',
    background: 'var(--surface-primary)',
    borderTop: '1px solid var(--border-light)',
    elevation: elevationTokens.lg,
    itemGap: '0.25rem',         // 4px
    iconSize: iconSizeTokens.lg,
    labelSize: typographyTokens.fontSize.xs,
    labelWeight: typographyTokens.fontWeight.medium,
    activeColor: 'var(--brand-500)',
    inactiveColor: 'var(--text-tertiary)',
    indicatorHeight: '0.25rem', // 4px
    indicatorRadius: radiusTokens.full,
  },

  // Top App Bar
  topAppBar: {
    height: layoutTokens.headerHeight,
    paddingX: spacingTokens.pageGutter,
    background: 'var(--surface-primary)',
    borderBottom: '1px solid var(--border-light)',
    elevation: elevationTokens.sm,
    titleSize: typographyTokens.fontSize.lg,
    titleWeight: typographyTokens.fontWeight.semibold,
    titleColor: 'var(--text-primary)',
    actionSize: iconSizeTokens.lg,
    actionColor: 'var(--text-secondary)',
    actionHoverColor: 'var(--text-primary)',
  },

  // KPI Card
  kpiCard: {
    padding: spacingTokens.cardPadding,
    radius: radiusTokens.xl,
    background: 'var(--surface-primary)',
    border: '1px solid var(--border-default)',
    gap: spacingTokens.inlineGapSm,
    iconSize: iconSizeTokens.xl,
  },

  // Form Field
  formField: {
    labelGap: '0.375rem',       // 6px
    helpTextSize: typographyTokens.fontSize.xs,
    helpTextColor: 'var(--text-tertiary)',
    errorColor: 'var(--danger-main)',
    requiredIndicatorColor: 'var(--danger-main)',
  },

  // Button
  button: {
    height: controlTokens.height.md,
    heightSm: controlTokens.height.sm,
    heightLg: controlTokens.height.lg,
    paddingX: controlTokens.paddingX.md,
    paddingXSm: controlTokens.paddingX.sm,
    paddingXLg: controlTokens.paddingX.lg,
    radius: radiusTokens.lg,
    fontSize: typographyTokens.fontSize.base,
    fontWeight: typographyTokens.fontWeight.medium,
    gap: spacingTokens.inlineGapSm,
    iconSize: iconSizeTokens.md,
  },

  // Dialog / Modal
  dialog: {
    padding: spacingTokens.cardPadding,
    radius: radiusTokens['2xl'],
    background: 'var(--surface-elevated)',
    maxWidth: '28rem',          // 448px
    maxHeight: '85vh',
    elevation: elevationTokens.xl,
    headerPadding: spacingTokens.cardPadding,
    bodyPadding: spacingTokens.cardPadding,
    footerPadding: spacingTokens.cardPadding,
    footerGap: spacingTokens.inlineGap,
  },

  // Table / List
  table: {
    cellPaddingY: '0.75rem',    // 12px
    cellPaddingX: '1rem',       // 16px
    headerSize: typographyTokens.fontSize.xs,
    headerWeight: typographyTokens.fontWeight.semibold,
    headerColor: 'var(--text-tertiary)',
    rowHoverBg: 'var(--surface-hover)',
    dividerColor: 'var(--border-light)',
  },

  // List Item
  listItem: {
    paddingY: '0.75rem',        // 12px
    paddingX: '1rem',           // 16px
    gap: spacingTokens.inlineGap,
    radius: radiusTokens.lg,
    hoverBg: 'var(--surface-hover)',
    activeBg: 'var(--surface-active)',
  },

  // Badge / Chip
  badge: {
    height: '1.375rem',         // 22px
    paddingX: '0.5rem',         // 8px
    radius: radiusTokens.full,
    fontSize: typographyTokens.fontSize.xs,
    fontWeight: typographyTokens.fontWeight.semibold,
    gap: '0.25rem',             // 4px
    iconSize: iconSizeTokens.xs,
  },

  // Divider
  divider: {
    color: 'var(--border-light)',
    thickness: '1px',
    marginY: spacingTokens.componentGap,
  },

  // Toast / Snackbar
  toast: {
    paddingX: '1rem',           // 16px
    paddingY: '0.75rem',        // 12px
    radius: radiusTokens.lg,
    gap: spacingTokens.inlineGap,
    fontSize: typographyTokens.fontSize.sm,
    fontWeight: typographyTokens.fontWeight.medium,
    elevation: elevationTokens.lg,
    minWidth: '16rem',          // 256px
    maxWidth: '28rem',          // 448px
  },

  // Progress / Loading
  progress: {
    height: '0.25rem',          // 4px
    radius: radiusTokens.full,
    trackColor: 'var(--border-light)',
    indicatorColor: 'var(--brand-500)',
  },

  // Skeleton / Placeholder
  skeleton: {
    baseColor: 'var(--surface-elevated)',
    highlightColor: 'var(--surface-hover)',
    animationDuration: '1.5s',
    radius: radiusTokens.md,
  },
} as const;