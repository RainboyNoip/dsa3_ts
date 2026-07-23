import { describe, expect, it } from 'vitest'
import { KMP } from '../Animate/kmp/kmp'
import samples from '../Animate/kmp/input_data/data.json'

describe('KMP input_data fixtures', () => {
    it('runs every sample to a terminal result', () => {
        expect(samples.length).toBeGreaterThan(0)
        for (const sample of samples) {
            const algorithm = new KMP()
            algorithm.set_input(sample.text, sample.pattern)
            const result = algorithm.run()
            expect(sample.name).toBeTruthy()
            expect(['complete', 'not_found']).toContain(result.status)
            expect(result.lps).toHaveLength(sample.pattern.length)
            expect(algorithm.frame_cnt).toBeGreaterThan(0)
            expect(algorithm.get_frame(algorithm.frame_cnt).status).toBe(result.status)
        }
    })
})
