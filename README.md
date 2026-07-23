# DSA3 算法动画演示平台

基于 Vite + Vue 3 + TypeScript 的算法可视化平台，使用 Cytoscape.js 渲染图结构，支持拓扑排序、Fleury 算法、强连通分支等算法的步进式动画演示。

## 快速开始

```bash
# 安装依赖
bun install

# 启动开发服务器（默认带 --host）
bun run dev

# 构建生产版本
bun run build

# 预览构建结果
bun run preview
```

## 项目结构

```
src/                  # 主入口（算法列表页）
  App.vue             # 算法列表主页
  animate_list.json   # 算法模块配置
Animate/
  topsort/            # 拓扑排序动画
  fleury/             # Fleury 算法（欧拉迹）动画
  dfsscc/             # 强连通分支算法动画
```

每个动画模块是独立的 Vue 应用，拥有自己的 `index.html` 入口和 `main.ts`。

## 部署

构建后产物在 `dist/` 目录。

```bash
./push.sh
```

该脚本会执行 `bun run build` 然后 rsync 到远程服务器。
