/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  future: {
    // Cinematic Atlas §4: hover effects only on devices that can hover,
    // so touch devices never get sticky poster/btn hover states.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    container: {
      center: true,
      screens: {
        lg: '1140px',
        xl: '1140px',
        '2xl': '1140px',
      },
    },
    extend: {
      colors: {
        // Tokens live as CSS variables on :root (see src/index.css) so the
        // palette can be audited/debugged at runtime. Values are hex/rgba;
        // opacity modifiers (bg-accent/50) are therefore not available by
        // design — use the explicit line/surface-glass tokens instead.
        surface: {
          void: 'var(--color-surface-void)',
          base: 'var(--color-surface-base)',
          raised: 'var(--color-surface-raised)',
          overlay: 'var(--color-surface-overlay)',
          glass: 'var(--color-surface-glass)',
        },
        // text-primary / text-secondary / text-muted map 1:1 to the spec's
        // text token table (the utility is text-<color>).
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          ink: 'var(--color-accent-ink)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          text: 'var(--color-success-text)',
        },
        danger: 'var(--color-danger)',
        line: {
          DEFAULT: 'var(--color-line)',
          strong: 'var(--color-line-strong)',
        },
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Floating panels only — cards use borders, not shadows (spec §3).
        cine: '0 24px 48px -24px rgb(0 0 0 / 0.8)',
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      transitionDuration: {
        '250': '250ms',
      },
      transitionTimingFunction: {
        cine: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        // Legacy aliases kept for existing components (SeasonTrailerModal etc.)
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Cinematic Atlas §4
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        'fade-in': 'fade-in 250ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 400ms cubic-bezier(0.22, 1, 0.36, 1) both',
        // Spec §5 Skeleton: shimmer 1.2s; apply as motion-safe:animate-shimmer.
        shimmer: 'shimmer 1.2s infinite linear',
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [],
}
