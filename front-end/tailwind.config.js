/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4f46e5', dark: '#3730a3', light: '#818cf8', bg: '#eef2ff' },
        success: { DEFAULT: '#059669', bg: '#ecfdf5', muted: '#a7f3d0', border: '#6ee7b7' },
        warning: { DEFAULT: '#d97706', bg: '#fffbeb', muted: '#fde68a', border: '#fcd34d' },
        danger:  { DEFAULT: '#dc2626', bg: '#fef2f2', muted: '#fee2e2', border: '#fecaca' },
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '7px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        xs: '0 1px 3px rgba(0,0,0,0.05)',
        sm: '0 2px 8px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
        md: '0 4px 16px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)',
        lg: '0 8px 28px rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.06)',
        primary: '0 4px 20px rgba(79,70,229,0.3)',
      },
      keyframes: {
        livePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        slideUp: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.96)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        livePulse: 'livePulse 2s ease infinite',
        slideUp:   'slideUp 0.3s ease',
        scaleIn:   'scaleIn 0.2s ease',
        shimmer:   'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
};
