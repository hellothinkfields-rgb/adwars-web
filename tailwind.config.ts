const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#C01920',
          dark: '#0b0a1a',
          navy: '#16213e',
          blue: '#0f3460',
        },
      },
    },
  },
  plugins: [],
};

export default config;
