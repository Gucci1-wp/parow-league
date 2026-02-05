/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Dark theme colors with turquoise accent
                navy: {
                    900: '#0f1729',
                    800: '#1a2332',
                    700: '#252f42',
                    600: '#303a52',
                },
                turquoise: {
                    400: '#60a5fa', // Blue 400
                    500: '#3b82f6', // Blue 500
                    600: '#2563eb', // Blue 600 (Primary)
                    700: '#1d4ed8', // Blue 700
                    800: '#1e40af', // Blue 800
                },
                blue: {
                    500: '#3b82f6',
                    600: '#2563eb',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
