//读取原始数据 生成数据

import fs from 'fs';
import path from 'path';
import {Graph,GraphType}  from '../../../src/lib/graph_ts'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const file_dir =  __dirname
console.log(file_dir)

const _data = [
    {
        name: '数据1',
        path: path.join(file_dir, 'in'),
    },
    {
        name: '数据2',
        path: path.join(file_dir, 'in2'),
    }
]

let json:any = []
_data.forEach((item) => {
    const data = fs.readFileSync(item.path, 'utf-8')
    const graph = new Graph(GraphType.digraph)
    graph.readFromString(data)
    json.push({
        name: item.name,
        nodes: graph.all_nodes,
        edges: graph.all_edges
    })
})
fs.writeFileSync(path.join(file_dir, 'data.json'), JSON.stringify(json, null, 4), 'utf-8')
