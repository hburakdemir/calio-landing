import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    target: 'es2019',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        kvkk: fileURLToPath(new URL('./sayfalar/kvkk.html', import.meta.url)),
        jiraAlternatifi: fileURLToPath(new URL('./sayfalar/jira-alternatifi.html', import.meta.url)),
        kvkkUyumluProjeYonetimi: fileURLToPath(new URL('./sayfalar/kvkk-uyumlu-proje-yonetimi.html', import.meta.url)),
        selfHostedProjeYonetimi: fileURLToPath(new URL('./sayfalar/self-hosted-proje-yonetimi.html', import.meta.url)),
        sorular: fileURLToPath(new URL('./sayfalar/sorular.html', import.meta.url)),
        trelloAlternatifi: fileURLToPath(new URL('./sayfalar/trello-alternatifi.html', import.meta.url)),
        azureDevopsAlternatifi: fileURLToPath(new URL('./sayfalar/azure-devops-alternatifi.html', import.meta.url)),
        notionAlternatifi: fileURLToPath(new URL('./sayfalar/notion-alternatifi.html', import.meta.url)),
        asanaKarsilastirma: fileURLToPath(new URL('./sayfalar/asana-karsilastirma.html', import.meta.url)),
        enIyiKanbanAraclari: fileURLToPath(new URL('./sayfalar/en-iyi-kanban-araclari.html', import.meta.url)),
        ozellikler: fileURLToPath(new URL('./sayfalar/ozellikler.html', import.meta.url)),
        tasima: fileURLToPath(new URL('./sayfalar/tasima.html', import.meta.url)),
        guvenlik: fileURLToPath(new URL('./sayfalar/guvenlik.html', import.meta.url)),
        fiyatlandirma: fileURLToPath(new URL('./sayfalar/fiyatlandirma.html', import.meta.url))
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
