import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        content_scripts: 'src/content_scripts.ts',
      },
      output: [
        {
          format: 'umd',
          entryFileNames: '[name].js',
        },
      ],
    },
  },
});
