const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '380px',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      // Skala radius disamakan dengan ERP (master/travel dashboard).
      borderRadius: {
        'lg': '0.375rem', // 6px: kontrol kecil
        'xl': '0.375rem', // 6px: tombol dan input
        '2xl': '0.5rem',  // 8px: kartu dan kontainer
        '3xl': '0.75rem', // 12px: panel besar
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary, #B87A3A)',
          light: 'color-mix(in srgb, var(--brand-primary, #B87A3A) 8%, transparent)',
          soft: 'color-mix(in srgb, var(--brand-primary, #B87A3A) 5%, white)',
        },
        neutral: colors.slate,
        success: colors.green,
        warning: colors.amber,
        danger: colors.red,
      },
    },
  },
  plugins: [],
};
