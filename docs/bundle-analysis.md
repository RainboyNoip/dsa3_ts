# 构建体积分析

基线日期：2026-07-23。

## 复现方式

```bash
bun run build:analyze
bun run size:check
```

`build:analyze` 使用 Rollup 的模块统计分析最大 JavaScript chunk；`size:check` 记录最终产物的 raw/gzip 大小并校验 CI 预算。

## 初始基线

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

## Ace 按需加载结果

将代码编辑器改为异步组件后，动画入口不再通过 HTML `modulepreload` 同步加载 Ace。移动端只有切换到“代码”页签时才创建编辑器。

| 资产 | 优化前 | 优化后 |
| --- | ---: | ---: |
| 同步共享 JS | 1,198.55 kB / gzip 355.89 kB | 721.24 kB / gzip 220.72 kB |
| Ace 异步 JS | 包含在共享包中 | 478.42 kB / gzip 135.88 kB |

同步共享 JS raw 体积下降约 39.8%。全部 JS 总量基本不变，收益来自延后下载和解析，而不是删除 Ace 功能。CI 的最大单文件预算已从 1.26 MB 收紧到 760 kB，防止 Ace 再次回到同步共享包。

## Naive UI tree-shaking 结果

Naive UI 的组件 barrel import 已改为组件级 ESM 子路径。进一步分析发现，`NSelect`、`NInputNumber` 和 `NInput` 通过 `useLocale()` 间接引入完整 locale 索引，因此这三个简单控件改为有同等键盘和无障碍语义的原生控件。按钮、进度、弹窗和错误提示仍使用 Naive UI。

| 指标 | 优化前 | 优化后 |
| --- | ---: | ---: |
| 同步共享 JS | 721.24 kB / gzip 221.22 kB | 549.32 kB / gzip 173.24 kB |
| Naive UI rendered modules | 537.4 KiB | 250.0 KiB |
| 全部 JS raw | 1435.9 KiB | 1270.3 KiB |

共享 JS raw 继续下降约 23.8%，全部 JS raw 下降约 11.5%。CI 预算同步收紧为最大单文件 580 kB、全部 JS 1.37 MB。
