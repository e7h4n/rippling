import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        'ccstate-devtools': 'ccstate-devtools.html',
        panel: 'panel.html',
      },
    },
  },
});
