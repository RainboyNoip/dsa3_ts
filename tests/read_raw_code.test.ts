import { describe, expect, it } from 'vitest'
import { read_raw_code } from '../src/lib/read_raw_code'

describe('read_raw_code', () => {
    it('parses paired markers and removes only the marker comments', () => {
        const result = read_raw_code([
            'void run() {',
            '  // [start] enter',
            '  value = 1; // [end] enter',
            '}',
        ].join('\n'))

        expect(result.point_jump_info).toEqual({ enter: [1, 2] })
        expect(result.code).toBe(['void run() {', '  ', '  value = 1; ', '}'].join('\n'))
        expect(result.diagnostics).toEqual([])
    })

    it('parses a single-line marker', () => {
        const result = read_raw_code('return value; // [start end] return')

        expect(result.point_jump_info).toEqual({ return: [0, 0] })
        expect(result.code).toBe('return value; ')
    })

    it('reports duplicate markers without overwriting the first range', () => {
        const result = read_raw_code([
            '// [start] step',
            'first(); // [end] step',
            '// [start end] step',
        ].join('\n'))

        expect(result.point_jump_info).toEqual({ step: [0, 1] })
        expect(result.diagnostics).toEqual([
            { type: 'duplicate', name: 'step', line: 2 },
        ])
    })

    it('reports orphan ends, missing ends, and unnamed markers', () => {
        const result = read_raw_code([
            '// [end] orphan',
            '// [start] open',
            '// [start]',
        ].join('\n'))

        expect(result.point_jump_info).toEqual({})
        expect(result.diagnostics).toEqual([
            { type: 'orphan_end', name: 'orphan', line: 0 },
            { type: 'invalid', name: '', line: 2 },
            { type: 'missing_end', name: 'open', line: 1 },
        ])
    })
})
