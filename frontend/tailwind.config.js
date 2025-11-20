/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'trader-yellow': '#FFCA0B',
                'trader-green': '#ADFA1D',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
