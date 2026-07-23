import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import { resolve } from "path"
import path from 'path'
import UnoCSS from 'unocss/vite'
import { algorithmRegistry } from './src/algorithmRegistry'
import { validateAlgorithmRegistry } from './build/validateAlgorithmRegistry'
import { bundleAnalysisPlugin } from './build/bundleAnalysisPlugin'

validateAlgorithmRegistry(__dirname, algorithmRegistry)

const algorithmInputs = Object.fromEntries(algorithmRegistry.map((algorithm) => [
  algorithm.buildName,
  path.resolve(__dirname, algorithm.entry),
]))

// https://vite.dev/config/
export default defineConfig({
  plugins: [bundleAnalysisPlugin(process.env.BUNDLE_ANALYZE === '1'), UnoCSS(),vue()],
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
        ...algorithmInputs,
      },
    },
  },
})
