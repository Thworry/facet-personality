# FACET｜人格切面

FACET 是一个完全在浏览器本地运行的娱乐向人格自我观察工具。32 个生活场景会生成六条核心维度、两个近期状态信号、一个核心原型、相邻切面与“当前天气”；它不上传逐题答案，也不把结果包装成心理诊断或准确率。

## 本地运行

项目固定使用仓库内已锁定的依赖。当前 Codex 环境没有 `npx`，请通过可用的 `pnpm` 执行命令：

```bash
FACET_PNPM=/Users/jojo/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm
"$FACET_PNPM" install --frozen-lockfile
"$FACET_PNPM" run dev
```

开发服务器默认监听 `http://127.0.0.1:5173`。应用没有后台、账号、分析脚本或第三方网络依赖。

## 自动化验证

```bash
FACET_PNPM=/Users/jojo/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm
"$FACET_PNPM" test
"$FACET_PNPM" exec tsc --noEmit
"$FACET_PNPM" run build
"$FACET_PNPM" exec playwright install chromium
"$FACET_PNPM" run test:e2e
```

Playwright 会直接使用 `./node_modules/.bin/vite` 启动测试服务器，因此不依赖全局 `npm` 或 `npx`。测试矩阵包括：

E2E 默认使用 `4173` 端口；若该端口已被其他本地项目占用，可执行 `FACET_E2E_PORT=4183 "$FACET_PNPM" run test:e2e`，应用与测试会共同切换到该端口。

- `mobile-chromium`：390 × 844，触摸环境；
- `desktop-chromium`：1280 × 900；
- `reduced-motion`：390 × 844，启用减少动态效果；
- 32 题完整流程、章节换乘、结果解释、十二原型图鉴、本地 PNG 下载与历史记录；
- Tab、数字键 1–5、Enter、ArrowLeft；
- 五题后刷新恢复与旧答案保留；
- FACET 本地进度和历史的确认删除、测试上下文隔离。

失败时会在 `test-results/` 保留截图与 trace，在 `playwright-report/` 生成本地 HTML 报告；两者均被 `.gitignore` 排除。

### 最近一次验证

2026-08-24 11:43 CST 使用 Chromium 140（Playwright build 1187）完成：

- Vitest：6 个文件、47 项测试全部通过；
- 严格 TypeScript：`tsc --noEmit` 无诊断；
- Playwright：3 个项目、15 项测试全部通过；
- 单文件构建：`dist/index.html` 75.77 kB，gzip 24.02 kB。

## 构建单文件版本

```bash
FACET_PNPM=/Users/jojo/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm
"$FACET_PNPM" run build
```

`vite-plugin-singlefile` 会把脚本与样式内联到 `dist/index.html`。最终交付前应再次检查该文件没有外部脚本、样式、字体、图片、分析或网络依赖。

## 数据边界

- 未完成进度保存在 `facet:v1:progress`；
- 最近三次结果保存在 `facet:v1:history`；
- “清除我的全部本地数据”只删除以上两个 FACET 键；
- 分享卡由 Canvas 在本地生成，不包含八维精确分数，不上传数据；
- 产品仅用于娱乐与自我观察，不用于诊断、招聘、职业选择或关系判决。
