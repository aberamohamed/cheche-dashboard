/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E30074',
          light: '#FF1A8C',
          dark: '#B8005C',
          50: '#FDF2F8',
          100: '#FCE7F3',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F5F7',
          border: '#E5E5EA',
        },
        text: {
          primary: '#1C1C1E',
          secondary: '#8E8E93',
          tertiary: '#AEAEB2',
        },
        success: '#34C759',
        warning: '#FF9500',
        danger: '#FF3B30',
      },
      borderRadius: {
        card: '16px',
        button: '14px',
        input: '12px',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
