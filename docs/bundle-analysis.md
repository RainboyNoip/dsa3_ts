# 构建体积分析

基线日期：2026-07-23。

## 复现方式

```bash
bun run build:analyze
bun run size:check
```

`build:analyze` 使用 Rollup 的模块统计分析最大 JavaScript chunk；`size:check` 记录最终产物的 raw/gzip 大小并校验 CI 预算。

## 当前基线

最大共享资产是 `__uno-*.js`，最终大小为 1,198.55 kB，gzip 后为 355.89 kB。文件名来自 Vite 的 chunk 命名，不表示内容主要由 UnoCSS 构成。

Rollup 的未压缩 rendered module 统计如下。它用于比较依赖的相对贡献，与最终压缩文件大小不是同一口径。

| 依赖组 | Rendered size | 占比 |
| --- | ---: | ---: |
| Cytoscape | 931.6 KiB | 35.4% |
| Ace 编辑器 | 924.7 KiB | 35.1% |
| Naive UI 及传递工具 | 537.4 KiB | 20.4% |
| 其他依赖 | 199.3 KiB | 7.6% |
| 项目代码 | 38.8 KiB | 1.5% |

补充产物：

- Iconify 位于独立的 `iconify-*.js`，最终大小 93.39 kB，gzip 后 36.52 kB。
- UnoCSS 没有可测量的运行时模块进入最大 JS chunk；公共 `__uno-*.css` 为 9.17 kB，gzip 后 2.29 kB。

## 优化顺序

1. 让 Ace 代码编辑器按需加载，避免它进入所有动画页的首屏同步依赖。
2. 检查 Naive UI 的导入与 tree-shaking，避免未使用组件、date-fns locale 和 lodash 工具进入共享包。
3. 保留 Cytoscape 作为图区域的核心依赖，先优化帧更新开销，再评估是否值得进一步拆分布局插件。
4. UnoCSS 当前不是 JavaScript 体积瓶颈，不优先替换。
