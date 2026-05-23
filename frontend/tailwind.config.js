/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Use CSS variables so the ThemeContext can update them at runtime.
        // The <alpha-value> placeholder enables Tailwind opacity modifiers
        // like bg-primary/10 and ring-primary/30.
        primary:   'rgb(var(--tw-primary)   / <alpha-value>)',
        secondary: 'rgb(var(--tw-secondary) / <alpha-value>)',
        dark:      'rgb(var(--tw-dark)      / <alpha-value>)',
        darker:    'rgb(var(--tw-darker)    / <alpha-value>)',
        light:     'rgb(var(--tw-light)     / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
