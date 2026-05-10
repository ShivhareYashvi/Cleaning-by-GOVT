/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        civic: {
          navy: '#0f172a',
          blue: '#0ea5e9',
          green: '#10b981',
          mint: '#d1fae5'
        }
      },
      boxShadow: {
        glass: '0 24px 80px rgba(15, 23, 42, 0.18)'
      },
      backgroundImage: {
        'ecosync-gradient': 'linear-gradient(135deg, #0f766e 0%, #0ea5e9 50%, #10b981 100%)'
      }
    }
  },
  plugins: []
};
