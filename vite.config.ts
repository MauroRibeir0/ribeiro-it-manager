import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env for the Google GenAI SDK usage in the app
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})