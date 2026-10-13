//读取原始数据 生成数据

import fs from 'fs';
import path from 'path';
import {Graph}  from '../../../src/lib/graph_ts'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const file_dir =  __dirname

const _data = [
    {
        name: '欧拉路（文章用例）',
        path: path.join(file_dir, 'in'),
    },
    {
        name: '主干与小环',
        path: path.join(file_dir, 'in2'),
    },
    {
        name: '欧拉回路',
        path: path.join(file_dir, 'in3'),
    },
    {
        name: '无解：奇度点过多',
        path: path.join(file_dir, 'in4'),
    },
    {
        name: '无解：走不完（不连通）',
        path: path.join(file_dir, 'in5'),
    },
]

let json:any = []
_data.forEach((item) => {
    const data = fs.readFileSync(item.path, 'utf-8')
    const graph = new Graph()
    graph.readFromString(data)
    json.push({
        name: item.name,
        nodes: graph.all_nodes,
        edges: graph.all_edges
    })
})
fs.writeFileSync(path.join(file_dir, 'data.json'), JSON.stringify(json, null, 4), 'utf-8')
