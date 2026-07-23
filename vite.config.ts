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
  base: '/new/',  // 你可以在这里设置 base 路径
  define: {
    __BASE_URL__: JSON.stringify('/new/'), // 自定义环境变量
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        fleury: path.resolve(__dirname, 'Animate/fleury/index.html'),
        topsort: path.resolve(__dirname, 'Animate/topsort/index.html'),
        dfsscc: path.resolve(__dirname, 'Animate/dfsscc/index.html'),
      },
    },
  },
})
