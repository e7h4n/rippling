import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        'rippling-devtools': 'rippling-devtools.html',
        panel: 'panel.html',
      },
    },
  },
});
