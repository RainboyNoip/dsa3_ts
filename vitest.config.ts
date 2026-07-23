import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      include: [
        'src/lib/**/*.ts',
        'Animate/*/*.ts',
      ],
      exclude: [
        'Animate/*/main.ts',
        'Animate/*/cyto.ts',
        'Animate/*/input_data/**',
      ],
    },
  },
})
