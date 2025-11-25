// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative pathing works correctly for deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets', 
    rollupOptions: {
      output: {
        // Simple asset naming pattern
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});