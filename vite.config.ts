import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { lab } from './plugins/lab.ts'

// GitHub Pages serves the site from /interaction-lab/
export default defineConfig({
  base: '/interaction-lab/',
  plugins: [react(), lab()],
})
