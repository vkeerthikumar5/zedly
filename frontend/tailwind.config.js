/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'z-dark': '#0f172a', /* slate-900 */
        'z-neutral': '#f8fafc',
        'z-primary': '#10b981', /* emerald-500 */
        'z-accent': '#6366f1', /* indigo-500 */
      }
    },
  },
  plugins: [],
}
