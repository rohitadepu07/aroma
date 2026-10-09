import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        product: resolve(__dirname, 'product.html'),
        collections: resolve(__dirname, 'collections.html'),
        about: resolve(__dirname, 'about.html'),
        confirmation: resolve(__dirname, 'order-confirmation.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
