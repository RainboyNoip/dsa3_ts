import { describe, expect, it } from 'vitest'
import { KMP } from '../Animate/kmp/kmp'

const runKmp = (text: string, pattern: string): KMP => {
    const algorithm = new KMP()
    algorithm.set_input(text, pattern)
    algorithm.run()
    return algorithm
}

describe('KMP string matching animation', () => {
    it('finds the classic match and builds the expected LPS table', () => {
        const algorithm = runKmp('ABABDABACDABABCABAB', 'ABABCABAB')
        const result = algorithm.get_result()

        expect(result).toEqual({
            status: 'complete',
            matchStart: 10,
            lps: [0, 0, 1, 2, 0, 1, 2, 3, 4],
        })
        expect(algorithm.frame_cnt).toBeGreaterThan(0)
        expect(Array.from({ length: algorithm.frame_cnt }, (_, index) => algorithm.get_frame(index + 1))
            .some((frame) => frame.compare?.result === 'fallback')).toBe(true)
    })

    it('handles repeated prefixes without rescanning the text', () => {
        const algorithm = runKmp('AAAAABAAABA', 'AAABA')
        expect(algorithm.get_result()?.matchStart).toBe(2)
        expect(algorithm.get_result()?.lps).toEqual([0, 1, 2, 0, 1])
        expect(Array.from({ length: algorithm.frame_cnt }, (_, index) => algorithm.get_frame(index + 1))
            .some((frame) => frame.phase === 'search' && frame.compare?.result === 'fallback')).toBe(true)
    })

    it('reports a missing match after consuming the text', () => {
        const algorithm = runKmp('HELLO WORLD', 'KMP')
        expect(algorithm.get_result()).toEqual({
            status: 'not_found',
            matchStart: null,
            lps: [0, 0, 0],
        })
        expect(algorithm.get_frame(algorithm.frame_cnt).phase).toBe('not_found')
    })

    it('supports an empty text and rejects an empty pattern', () => {
        const emptyText = runKmp('', 'A')
        expect(emptyText.get_result()?.status).toBe('not_found')
        expect(emptyText.get_frame(emptyText.frame_cnt).i).toBe(0)

        const emptyTextWithPrefix = runKmp('', 'AAA')
        for (let index = 0; index <= emptyTextWithPrefix.frame_cnt; index += 1) {
            expect(emptyTextWithPrefix.get_frame(index).compare).toBeNull()
        }

        const emptyPattern = runKmp('ABC', '')
        expect(emptyPattern.get_result()).toMatchObject({ status: 'invalid', matchStart: null, lps: [] })
        expect(emptyPattern.get_frame(1).phase).toBe('invalid')
    })

    it('keeps every frame pointer and comparison inside the input bounds', () => {
        const algorithm = runKmp('AB', 'ABABA')
        for (let index = 0; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expect(frame.lps).toHaveLength(frame.pattern.length)
            expect(frame.i).toBeGreaterThanOrEqual(0)
            expect(frame.i).toBeLessThanOrEqual(frame.text.length)
            expect(frame.j).toBeGreaterThanOrEqual(0)
            expect(frame.j).toBeLessThanOrEqual(frame.pattern.length)
            expect(frame.jump).toHaveLength(2)
            if (frame.compare) {
                expect(frame.compare.textIndex).toBeGreaterThanOrEqual(0)
                expect(frame.compare.textIndex).toBeLessThanOrEqual(Math.max(0, frame.text.length - 1))
                expect(frame.compare.patternIndex).toBeGreaterThanOrEqual(0)
                expect(frame.compare.patternIndex).toBeLessThanOrEqual(Math.max(0, frame.pattern.length - 1))
            }
        }
    })
})
