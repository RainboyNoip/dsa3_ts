import { existsSync } from 'node:fs'
import path from 'node:path'
import type { AlgorithmDefinition } from '../src/algorithmRegistry'

type RegistryEntry = Pick<AlgorithmDefinition, 'id' | 'buildName' | 'entry' | 'sourceFile'>

const sharedFiles = [
  'index.html',
  'main.ts',
  'App.vue',
  'code.cpp',
  'input_data/data.json',
] as const

export function validateAlgorithmRegistry(
  projectRoot: string,
  registry: readonly RegistryEntry[],
): void {
  const errors: string[] = []
  validateUniqueField(registry, 'id', errors)
  validateUniqueField(registry, 'buildName', errors)
  validateUniqueField(registry, 'entry', errors)

  for (const algorithm of registry) {
    const directory = path.dirname(algorithm.entry)
    const requiredFiles = [...sharedFiles, algorithm.sourceFile]
    for (const file of requiredFiles) {
      const relativePath = path.join(directory, file)
      if (!existsSync(path.resolve(projectRoot, relativePath))) {
        errors.push(`${algorithm.id}: missing ${relativePath}`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Algorithm registry validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`)
  }
}

function validateUniqueField(
  registry: readonly RegistryEntry[],
  field: keyof RegistryEntry,
  errors: string[],
): void {
  const seen = new Set<string>()
  for (const algorithm of registry) {
    const value = algorithm[field]
    if (seen.has(value)) errors.push(`${algorithm.id}: duplicate ${field} "${value}"`)
    seen.add(value)
  }
}
