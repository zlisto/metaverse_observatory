import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  // 5173 Yale, 5174 Darul, 5175 browser, 5176 starter, 5178 hub, 5179 observatory
  server: { port: 5179, strictPort: true },
})
