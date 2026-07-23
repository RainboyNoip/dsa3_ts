# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## 新的设计  2025-09-07

为了进一不的简化代码,我需要对代码进一不进行封装


cytoscape.js,  画布控层,抽象出一个类
  - edge 类
  - node 类
  - frame 类
  - get_all_nodes
  - get_all_edges
  - set_node_buf
  - set_edge_buf
  - dump_frame_buf
  - apply_frame
  - real_frame_to_buffer

  cytoscape 有两层frame, 一个是真正的正在实际显示的帧
  一个buffer_frame

`code_editor` ,对edior 进行控制
algo 各种算法, 数据生成层,主要生成动画数据帧
  怎么生成呢?
  通过cytoscape.js 的set_node_buf,set_edge_buf,dump_frame_buf
其他辅助函数
- 数据读取
- 随机树 图生成

