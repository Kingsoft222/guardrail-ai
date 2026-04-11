import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // Fast build, no extra tools needed
    cssCodeSplit: false,
    assetsInlineLimit: 100000, // Put icons directly in the code so they can't be "lost"
    rollupOptions: {
      output: {
        manualChunks: undefined 
      }
    }
  }
})