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

type FrameRunner = {
    run: () => { status: string }
    readonly frameCount: number
    getFrame: (index: number) => unknown
}

type BenchmarkCase = {
    label: string
    graphType: GraphType
    samples: readonly GraphSample[]
    createRunner: (graph: Graph) => FrameRunner
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

const cases: BenchmarkCase[] = [
    {
        label: 'BFS',
        graphType: GraphType.undigraph,
        samples: bfsSamples,
        createRunner: (graph) => {
            const algorithm = new BFS()
            algorithm.set_graph(graph)
            return {
                run: () => algorithm.run_bfs(),
                get frameCount() { return algorithm.frame_cnt },
                getFrame: (index) => algorithm.get_frame(index),
            }
        },
    },
    {
        label: 'BFS 最短路',
        graphType: GraphType.undigraph,
        samples: bfsShortestPathSamples,
        createRunner: (graph) => {
            const algorithm = new BFS_SP()
            algorithm.set_graph(graph)
            return {
                run: () => algorithm.run_bfs_sp(),
                get frameCount() { return algorithm.frame_cnt },
                getFrame: (index) => algorithm.get_frame(index),
            }
        },
    },
    {
        label: 'DFS',
        graphType: GraphType.undigraph,
        samples: dfsSamples,
        createRunner: (graph) => {
            const algorithm = new DFS()
            algorithm.set_graph(graph)
            return {
                run: () => algorithm.run_dfs(),
                get frameCount() { return algorithm.frame_cnt },
                getFrame: (index) => algorithm.get_frame(index),
            }
        },
    },
    {
        label: '拓扑排序',
        graphType: GraphType.digraph,
        samples: topSortSamples,
        createRunner: (graph) => {
            const algorithm = new topsort()
            algorithm.set_graph(graph)
            return {
                run: () => algorithm.run_top_sort(),
                get frameCount() { return algorithm.frame_cnt },
                getFrame: (index) => algorithm.get_frame(index),
            }
        },
    },
    {
        label: '强连通分量',
        graphType: GraphType.digraph,
        samples: sccSamples,
        createRunner: (graph) => {
            const algorithm = new Dfsscc(graph)
            return {
                run: () => algorithm.run_dfsscc(),
                get frameCount() { return algorithm.frame_cnt },
                getFrame: (index) => algorithm.get_frame(index),
            }
        },
    },
    {
        label: 'Tarjan 割点',
        graphType: GraphType.undigraph,
        samples: tarjanSamples,
        createRunner: (graph) => {
            const algorithm = new TarjanCut()
            algorithm.set_graph(graph)
            return {
                run: () => algorithm.run(),
                get frameCount() { return algorithm.frame_cnt },
                getFrame: (index) => algorithm.get_frame(index),
            }
        },
    },
    {
        label: 'Fleury',
        graphType: GraphType.undigraph,
        samples: fleurySamples,
        createRunner: (graph) => {
            const algorithm = new fleury()
            algorithm.set_graph(graph)
            return {
                run: () => algorithm.run(),
                get frameCount() { return algorithm.frame_cnt },
                getFrame: (index) => algorithm.get_frame(index),
            }
        },
    },
    {
        label: 'Hierholzer',
        graphType: GraphType.undigraph,
        samples: hierholzerSamples,
        createRunner: (graph) => {
            const algorithm = new Hierholzer()
            algorithm.set_graph(graph)
            return {
                run: () => algorithm.run(),
                get frameCount() { return algorithm.frame_cnt },
                getFrame: (index) => algorithm.get_frame(index),
            }
        },
    },
]

const textEncoder = new TextEncoder()

const largestSample = (samples: readonly GraphSample[]): GraphSample => samples.reduce((largest, sample) => (
    sample.nodes.length + sample.edges.length > largest.nodes.length + largest.edges.length
        ? sample
        : largest
))

const formatKiB = (bytes: number): string => (bytes / 1024).toFixed(1)

console.log('| 算法 | 样例 | 节点 | 边 | 帧数 | 序列化帧总量 (KiB) | 最大单帧 (KiB) | 运行时间 (ms) |')
console.log('| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |')

for (const benchmarkCase of cases) {
    const sample = largestSample(benchmarkCase.samples)
    const graph = graphFromSample(sample, benchmarkCase.graphType)
    const runner = benchmarkCase.createRunner(graph)
    const startedAt = performance.now()
    const result = runner.run()
    const runTimeMs = performance.now() - startedAt
    let serializedBytes = 0
    let largestFrameBytes = 0

    for (let index = 1; index <= runner.frameCount; index += 1) {
        const frameBytes = textEncoder.encode(JSON.stringify(runner.getFrame(index))).byteLength
        serializedBytes += frameBytes
        largestFrameBytes = Math.max(largestFrameBytes, frameBytes)
    }

    if (result.status !== 'complete') {
        throw new Error(`${benchmarkCase.label} 样例 ${sample.name} 未完成：${result.status}`)
    }

    console.log(`| ${benchmarkCase.label} | ${sample.name} | ${graph.node_cnt} | ${graph.edge_cnt} | ${runner.frameCount} | ${formatKiB(serializedBytes)} | ${formatKiB(largestFrameBytes)} | ${runTimeMs.toFixed(2)} |`)
}
