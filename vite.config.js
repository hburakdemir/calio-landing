import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    target: 'es2019',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        kvkk: fileURLToPath(new URL('./kvkk.html', import.meta.url)),
        jiraAlternatifi: fileURLToPath(new URL('./jira-alternatifi.html', import.meta.url)),
        kvkkUyumluProjeYonetimi: fileURLToPath(new URL('./kvkk-uyumlu-proje-yonetimi.html', import.meta.url)),
        selfHostedProjeYonetimi: fileURLToPath(new URL('./self-hosted-proje-yonetimi.html', import.meta.url)),
        sorular: fileURLToPath(new URL('./sorular.html', import.meta.url))
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
