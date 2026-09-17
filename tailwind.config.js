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
