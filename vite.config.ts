import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import { resolve } from "path"
import path from 'path'
import UnoCSS from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [UnoCSS(),vue()],
  resolve: {
    alias: {
      // '@': path.resolve(import.meta.url, "src")
      '@': path.resolve(__dirname, "src")
    }
  },
  build: {
    rollupOptions: {
      input: {
        fleury: path.resolve(__dirname, 'Animate/fleury/index.html'),
      },
    },
  },
})
