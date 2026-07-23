import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { algorithmRegistry } from '../src/algorithmRegistry'
import { validateAlgorithmRegistry } from '../build/validateAlgorithmRegistry'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))

describe('algorithm registry validation', () => {
  it('accepts every registered algorithm in the repository', () => {
    expect(() => validateAlgorithmRegistry(projectRoot, algorithmRegistry)).not.toThrow()
  })

  it('reports duplicate build names', () => {
    const duplicateRegistry = [
      { ...algorithmRegistry[0], buildName: algorithmRegistry[1].buildName },
      ...algorithmRegistry.slice(1),
    ]

    expect(() => validateAlgorithmRegistry(projectRoot, duplicateRegistry)).toThrow(
      /fleury: duplicate buildName "fleury"/,
    )
  })

  it('reports missing required files with their algorithm ID', () => {
    const missingSource = [{ ...algorithmRegistry[0], sourceFile: 'missing.ts' as const }]

    expect(() => validateAlgorithmRegistry(projectRoot, missingSource)).toThrow(
      /topsort: missing Animate\/topsort\/missing\.ts/,
    )
  })
})
