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
  base: '/',
  define: {
    __BASE_URL__: JSON.stringify('/'),
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        fleury: path.resolve(__dirname, 'Animate/fleury/index.html'),
        topsort: path.resolve(__dirname, 'Animate/topsort/index.html'),
        dfsscc: path.resolve(__dirname, 'Animate/dfsscc/index.html'),
        bfs: path.resolve(__dirname, 'Animate/bfs/index.html'),
        bfs_sp: path.resolve(__dirname, 'Animate/bfs_shortest_path/index.html'),
        dfs: path.resolve(__dirname, 'Animate/dfs/index.html'),
        tarjan_cut: path.resolve(__dirname, 'Animate/tarjan_cut/index.html'),
      },
    },
  },
})
