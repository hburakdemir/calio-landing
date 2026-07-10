import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    target: 'es2019',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        kvkk: fileURLToPath(new URL('./kvkk.html', import.meta.url))
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        }
      }
    }
  },
  server: {
    port: 5199
  },
  preview: {
    port: 5199
  }
});
