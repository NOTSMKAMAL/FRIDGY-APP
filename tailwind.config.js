/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
 content: [
  "./App.{js,jsx,ts,tsx}",        // catch App.js or App.tsx
  "./app/**/*.{js,jsx,ts,tsx}",
  "./components/**/*.{js,jsx,ts,tsx}",
  "./src/**/*.{js,jsx,ts,tsx}",   // add if you have a src/ folder
],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#FFFFFF',
        brand: "#06402B",
        plum: "#702963",
        ocean: "#005F84",
        berry: "#660033",
        umber: "#7A3803",
        olive: "#545F4C",
        slateish: "#5D6E74",
        indigoish: "#293570",
      }
    },
  },
  plugins: [],
}