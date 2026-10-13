import { describe, expect, it } from 'vitest'
import { Graph, GraphType } from '../src/lib/graph_ts'
import { BFS } from '../Animate/bfs/bfs'
import bfsSamples from '../Animate/bfs/input_data/data.json'
import { BFS_SP } from '../Animate/bfs_shortest_path/bfs_sp'
import bfsShortestPathSamples from '../Animate/bfs_shortest_path/input_data/data.json'
import { DFS } from '../Animate/dfs/dfs'
import dfsSamples from '../Animate/dfs/input_data/data.json'
import { Dfsscc } from '../Animate/dfsscc/dfsscc'
import sccSamples from '../Animate/dfsscc/input_data/data.json'
import { fleury } from '../Animate/fleury/fleury'
import fleurySamples from '../Animate/fleury/input_data/data.json'
import { Hierholzer } from '../Animate/hierholzer/hierholzer'
import hierholzerSamples from '../Animate/hierholzer/input_data/data.json'
import { TarjanCut } from '../Animate/tarjan_cut/tarjan'
import tarjanSamples from '../Animate/tarjan_cut/input_data/data.json'
import { topsort } from '../Animate/topsort/topsort'
import topSortSamples from '../Animate/topsort/input_data/data.json'

type GraphSample = {
    name: string
    nodes: Array<{ data: { id: string } }>
    edges: Array<{ data: { source: string; target: string; weight?: number } }>
}

const graphFromSample = (sample: GraphSample, type: GraphType): Graph => {
    const graph = new Graph(type)
    sample.nodes.forEach(({ data }) => graph.addVertex(Number(data.id)))
    sample.edges.forEach(({ data }) => graph.addEdge(
        Number(data.source),
        Number(data.target),
        data.weight ?? 0,
    ))
    return graph
}

const expectCompleteFixtures = (
    samples: GraphSample[],
    type: GraphType,
    run: (graph: Graph) => { status: string; frameCount: number },
): void => {
    expect(samples.length).toBeGreaterThan(0)
    for (const sample of samples) {
        expect(sample.name).toBeTruthy()
        expect(sample.nodes.length).toBeGreaterThan(0)
        const result = run(graphFromSample(sample, type))
        expect(result.status, sample.name).toBe('complete')
        expect(result.frameCount, sample.name).toBeGreaterThan(0)
    }
}

describe('input_data regression fixtures', () => {
    it('runs every BFS sample', () => {
        expectCompleteFixtures(bfsSamples, GraphType.undigraph, (graph) => {
            const algorithm = new BFS()
            algorithm.set_graph(graph)
            return { status: algorithm.run_bfs().status, frameCount: algorithm.frame_cnt }
        })
    })

    it('runs every DFS sample', () => {
        expectCompleteFixtures(dfsSamples, GraphType.undigraph, (graph) => {
            const algorithm = new DFS()
            algorithm.set_graph(graph)
            return { status: algorithm.run_dfs().status, frameCount: algorithm.frame_cnt }
        })
    })

    it('runs every BFS shortest-path sample', () => {
        expectCompleteFixtures(bfsShortestPathSamples, GraphType.undigraph, (graph) => {
            const algorithm = new BFS_SP()
            algorithm.set_graph(graph)
            return { status: algorithm.run_bfs_sp().status, frameCount: algorithm.frame_cnt }
        })
    })

    it('runs every topological-sort sample', () => {
        expectCompleteFixtures(topSortSamples, GraphType.digraph, (graph) => {
            const algorithm = new topsort()
            algorithm.set_graph(graph)
            return { status: algorithm.run_top_sort().status, frameCount: algorithm.frame_cnt }
        })
    })

    it('runs every SCC sample', () => {
        expectCompleteFixtures(sccSamples, GraphType.digraph, (graph) => {
            const algorithm = new Dfsscc(graph)
            return { status: algorithm.run_dfsscc().status, frameCount: algorithm.frame_cnt }
        })
    })

    it('runs every Tarjan cut-vertex sample', () => {
        expectCompleteFixtures(tarjanSamples, GraphType.undigraph, (graph) => {
            const algorithm = new TarjanCut()
            algorithm.set_graph(graph)
            return { status: algorithm.run().status, frameCount: algorithm.frame_cnt }
        })
    })

    it('runs every Fleury sample', () => {
        expectCompleteFixtures(fleurySamples, GraphType.undigraph, (graph) => {
            const algorithm = new fleury()
            algorithm.set_graph(graph)
            return { status: algorithm.run().status, frameCount: algorithm.frame_cnt }
        })
    })

    it('runs every Hierholzer sample with the expected verdict', () => {
        const expectedStatus: Record<string, string> = {
            '欧拉路（文章用例）': 'complete',
            '主干与小环': 'complete',
            '欧拉回路': 'complete',
            '无解：不连通': 'no_euler_trail',
        }
        expect(hierholzerSamples.length).toBeGreaterThan(0)
        for (const sample of hierholzerSamples) {
            expect(sample.name).toBeTruthy()
            expect(sample.nodes.length).toBeGreaterThan(0)
            const graph = graphFromSample(sample, GraphType.undigraph)
            const algorithm = new Hierholzer()
            algorithm.set_graph(graph)
            const result = algorithm.run()
            expect(result.status, sample.name).toBe(expectedStatus[sample.name])
            expect(algorithm.frame_cnt, sample.name).toBeGreaterThan(0)
            if (result.status === 'complete') {
                expect(result.path, sample.name).toHaveLength(graph.edge_cnt + 1)
                expect(result.path[0], sample.name).toBe(result.start)
            }
        }
    })
})
