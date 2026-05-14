import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // sockjs-client and some other libs expect Node's `global` — polyfill it
    global: 'globalThis',
  },
})
