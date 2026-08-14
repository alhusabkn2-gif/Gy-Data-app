/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#00BCDF',     // Cyan dake saman Welcome Header & Buttons
          green: '#74C856',    // Koren Buy Airtime card da Go to Home button
          orange: '#FF914D',   // Orange dake kasan background shapes
          lightGreen: '#EBF9E8', // Light green background na Buy Airtime
          lightOrange: '#FFF1E8',// Light orange background na Transaction History
        }
      }
    },
  },
  plugins: [],
}
