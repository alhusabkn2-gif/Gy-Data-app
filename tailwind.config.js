/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Muna canja ainihin kalolin Tailwind domin duk shafin da ke amfani da bg-gray ko bg-slate ya dawo kalar annashuwa kai tsaye
        gray: {
          50: '#F4FAF8',
          100: '#E6F4F1',
          900: '#0F172A',
        },
        slate: {
          50: '#F4FAF8',
          100: '#E6F4F1',
          900: '#0F172A',
        },
        brand: {
          bg: '#F4FAF8',
          primary: '#0D9488',
          accent: '#F97316',
        }
      },
    },
  },
  plugins: [],
};
