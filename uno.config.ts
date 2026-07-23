import presetUno from '@unocss/preset-uno'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
  ],
  shortcuts: {
    'card-1': 'border-solid border-gray-300 border-1 rounded shadow shadow-coolgray',
  },
})
