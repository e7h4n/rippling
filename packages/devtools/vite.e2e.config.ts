import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        e2e: 'e2e.test.html',
      },
    },
  },
});
