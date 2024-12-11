import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        index: 'devtools.html',
        panel: 'panel.html',
        prepare_injection: 'src/prepare_injection.ts',
        background: 'src/background.ts',
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
