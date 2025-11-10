module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Stronger black & white neutral palette for higher contrast
        neutral: {
          50: '#ffffff',
          100: '#ffffff',
          200: '#f7f7f7',
          300: '#e5e5e5',
          400: '#bfbfbf',
          500: '#8c8c8c',
          600: '#444444',
          700: '#222222',
          800: '#111111',
          900: '#000000',
        }
      }
    },
  },
  plugins: [],
}
