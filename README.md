# DSA3 算法动画演示平台

DSA3 是一个基于 Vue 3、TypeScript 和 Vite 的图算法可视化项目。每个算法都是独立的多页应用，共用播放控制、响应式工作区、Cytoscape 图渲染和 C++ 代码联动组件。界面固定使用 Light 主题。

## 算法目录

| 算法 | 路径 | 图类型 |
| --- | --- | --- |
| 拓扑排序 | `/Animate/topsort/` | 有向图 |
| Fleury 欧拉迹 | `/Animate/fleury/` | 无向图 |
| 强连通分量 | `/Animate/dfsscc/` | 有向图 |
| BFS 遍历 | `/Animate/bfs/` | 无向图 |
| BFS 最短路 | `/Animate/bfs_shortest_path/` | 无向等权图 |
| DFS 遍历 | `/Animate/dfs/` | 无向图 |
| Tarjan 割点 | `/Animate/tarjan_cut/` | 无向图 |

## 本地开发

项目使用 Bun 管理依赖和运行脚本。

```bash
bun install
bun run dev
```

开发服务器默认监听所有网络接口。首页由 `src/main.ts` 启动，各算法入口由 Vite 的多页构建配置生成。

常用命令：

```bash
bun run typecheck       # Vue 和 TypeScript 类型检查
bun run test            # Vitest 单元测试
bun run test:watch      # 监听模式运行单元测试
bun run test:coverage   # 生成单元测试覆盖率
bun run build           # 类型检查并构建 dist/
bun run preview         # 预览生产构建
bun run test:e2e        # Playwright 浏览器测试
```

Playwright 默认使用 `/usr/bin/chromium`。需要指定其他 Chromium 时设置：

```bash
PLAYWRIGHT_CHROMIUM_PATH=/path/to/chromium bun run test:e2e
```

提交前应依次运行：

```bash
bun run typecheck
bun run test
bun run build
bun run test:e2e
```

## 项目结构

```text
src/
  algorithmRegistry.ts              # 算法元数据和入口的单一配置源
  animation/                        # 公共动画类型、播放器和图渲染器
  components/                       # 公共工作区、控制栏、输入和代码组件
  App.vue                           # 算法目录首页
build/
  validateAlgorithmRegistry.ts      # 构建时校验算法目录
Animate/
  <algorithm>/
    index.html                      # 独立页面入口
    main.ts                         # Vue 启动文件
    App.vue                         # 算法动画页面
    <sourceFile>.ts                 # 算法和动画帧生成逻辑
    code.cpp                        # 与动画联动的 C++ 源码
    input_data/data.json            # 回归样例和页面数据集
tests/
  e2e/                              # Playwright 跨页面和跨视口测试
```

## 注册新算法

1. 在 `Animate/<algorithm>/` 创建上面列出的必需文件，并确保 `sourceFile` 与实际算法 TypeScript 文件名一致。
2. 在 `src/algorithmRegistry.ts` 的 `algorithmRegistry` 中增加一项，填写唯一的 `id`、`buildName`、`entry`、`sourceFile` 和首页展示元数据。
3. 在 `code.cpp` 中使用 `// [start] name`、`// [end] name` 或 `// [start end] name` 标记动画对应的代码范围。
4. 为算法结果、关键帧不变量和输入边界增加 Vitest 测试，并在 Playwright smoke test 中覆盖新入口。
5. 运行完整验证命令。

首页卡片和 Vite 多页入口都直接读取注册表，不需要维护第二份入口列表。开发服务器和生产构建启动时会校验 ID、构建名、入口是否唯一，并检查算法目录中的必需文件；缺失或重复会直接使启动或构建失败。

## 部署

生产构建输出到 `dist/`。`deploy.sh` 会先执行一次 `bun run build`，成功后将 `dist/` 同步到脚本中配置的远程目录：

```bash
./deploy.sh
```

运行前需要配置脚本使用的 SSH 主机别名并确认远程目录。同步命令包含 `rsync --delete`，远端中不属于当前 `dist/` 的文件会被删除。
