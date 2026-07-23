import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { read_raw_code } from '../src/lib/read_raw_code'

type CodeFixture = {
    file: string
    markers: Record<string, string>
}

const codeFixtures: CodeFixture[] = [
    {
        file: '../Animate/bfs/code.cpp',
        markers: {
            bfs_init: 'que.push(start);',
            que_pop: 'int u = que.front();',
            check_adj_edge: 'if( vis[v] ) continue;',
            que_push: 'que.push(v);',
        },
    },
    {
        file: '../Animate/bfs_shortest_path/code.cpp',
        markers: {
            bfs_init: 'que.push({start,0});',
            que_pop: 'auto [u,step] = que.front();',
            check_adj_edge: 'if( vis[v] ) continue;',
            que_push: 'dis[v] = step + 1;',
        },
    },
    {
        file: '../Animate/dfs/code.cpp',
        markers: {
            dfs_set_visited: 'vis[u] = 1;',
            dfs_check_edge: 'for(int i = e(u);i != -1 ;i= e[i].next)',
        },
    },
    {
        file: '../Animate/dfsscc/code.cpp',
        markers: {
            dfsscc_start: 'dfsscc(1);',
            'set some value': 'dfn[u] = low[u] = ++_time;',
            'not visited': 'dfsscc(v);',
            update_low_1: 'low[u] = min(low[u],low[v]);',
            update_low_2: 'low[u] = min(low[u],dfn[v]);',
            'set strong connected component': 'color[t] = color_idx;',
        },
    },
    {
        file: '../Animate/fleury/code.cpp',
        markers: {
            'find start point': 'for(int i = n;i >=1;i--)',
            'check odd_deg_cnt': 'if( odd_deg_cnt > 2 )',
            fleury_find_next: 'int edge_idx  = fleury_find_next(u);',
            'deal with edge': 'e.del_edge2(edge_idx);',
        },
    },
    {
        file: '../Animate/tarjan_cut/code.cpp',
        markers: {
            tarjan_enter: 'dfn[u] = low[u] = ++dfs_time;',
            tarjan_check_edge: 'int v = e.e[i].v;',
            tarjan_skip_parent: 'if(v == fa)',
            tarjan_update_low_child: 'low[u] = min(low[u],low[v]);',
            tarjan_cut_found: 'cut[u] = true;',
            tarjan_update_low_back: 'low[u] = min(low[u],dfn[v]);',
            tarjan_root_cut: 'if(fa == 0 && child > 1)',
        },
    },
    {
        file: '../Animate/topsort/code.cpp',
        markers: {
            'push zero in_deg point': 'if( in_deg[i] == 0) que.push(i);',
            'get u from que': 'int u = que.front();',
            'get v from u': '--in_deg[v];',
            'push v to que': 'if( in_deg[v] == 0) que.push(v);',
        },
    },
]

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

    it.each(codeFixtures)('keeps $file marker ranges aligned with Ace rows', ({ file, markers }) => {
        const rawCode = readFileSync(new URL(file, import.meta.url), 'utf8')
        const result = read_raw_code(rawCode)
        const lines = result.code.split('\n')

        expect(result.diagnostics).toEqual([])
        expect(result.code).not.toMatch(/\/\/\s*\[(?:start|end)/)

        for (const [name, expectedCode] of Object.entries(markers)) {
            const range = result.point_jump_info[name]
            expect(range, `${file}: ${name}`).toBeDefined()
            const [start, end] = range
            expect(start).toBeGreaterThanOrEqual(0)
            expect(end).toBeGreaterThanOrEqual(start)
            expect(end).toBeLessThan(lines.length)
            expect(lines.slice(start, end + 1).join('\n')).toContain(expectedCode)
        }
    })
})
