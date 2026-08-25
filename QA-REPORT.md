# FACET 双语开源发布验收报告

> 验收时间：2026-08-25 12:15:35 至 12:53:43 CST（Asia/Shanghai）
>
> 验收基线：`ab87df6` 加 Task 9 单文件验收与分享卡可读性修复
>
> 浏览器：Playwright Chromium 140（build 1187）
>
> 结论：**PASS / READY FOR PUBLIC DEPLOYMENT**

## 1. 结论

FACET 的中英文页面、计分与存储回归、本地 Canvas 分享卡、响应式布局、键盘与触控目标、减少动态效果、单文件构建和最终 outputs 文件均通过验收。

本轮没有发现 blocker、high 或 medium 问题。机器审计覆盖 36 个页面状态和 22 个隔离浏览器会话，结果为：

- 0 console error；
- 0 page error；
- 0 failed request；
- 0 HTTP/HTTPS 外部请求；
- 0 横向溢出状态；
- 0 个小于 44 × 44px 的可见交互目标；
- 0 个未关闭的自动审计失败项。

## 2. 最终门禁

| 门禁 | 实际结果 | 状态 |
|---|---:|---|
| `pnpm install --frozen-lockfile` | pnpm 11.19.0，锁文件无变化 | PASS |
| Vitest | 8 个文件，94/94 | PASS |
| 本地 HTTP E2E | 3 个项目，33/33 | PASS |
| 独立 `file://` E2E | 1 个项目，1/1 | PASS |
| TypeScript | `tsc --noEmit` 无诊断 | PASS |
| Vite 单文件构建 | 124,940 bytes，gzip 42.07 kB | PASS |
| 双语渲染审计 | 36 个状态，22 个会话 | PASS |
| 最终 outputs 同步 | `cmp` 与 SHA-256 一致 | PASS |

本地 HTTP E2E 项目：

- `mobile-chromium`：390 × 844；
- `desktop-chromium`：1280 × 900；
- `reduced-motion`：390 × 844，启用减少动态效果。

独立文件项目 `file-chromium` 直接打开 `dist/index.html`，不启动服务器。它验证中文预置、切换英文、刷新保留英文、说明页、首题作答、内联脚本与样式，以及零非 `file:` 请求。

## 3. 单文件与隐私检查

最终构建：

```text
/Users/jojo/Documents/Codex/2026-08-24/sb/work/facet/dist/index.html
124,940 bytes
SHA-256 04f4fc89dde5ef494aa37a6998e1cf7d54c5f4d1cae41a6e73021322c0b08c80
```

用户交付文件：

```text
/Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html
124,940 bytes
SHA-256 04f4fc89dde5ef494aa37a6998e1cf7d54c5f4d1cae41a6e73021322c0b08c80
```

`cmp -s` 通过，两个文件逐字节一致。对构建产物扫描以下模式均为 0 命中：

```text
https?://
<script ... src=>
<link ... href=>
@import
analytics
telemetry
```

浏览器实际观察到的本地键只有：

- `facet:v1:locale`；
- `facet:v1:progress`；
- `facet:v2:history`。

源码还保留 `facet:v1:history`，仅用于旧历史的一次性迁移和完整删除。应用没有账号、cookie、远程字体、统计脚本、答案上传或第三方运行时资源。

## 4. 双语渲染矩阵

机器审计使用最终 `file://` 构建，覆盖以下视口：

| 宽度 | 高度 | 中英文首页/说明 | 补充状态 |
|---:|---:|---|---|
| 360 | 800 | 中文、English | 中文最长题、键盘焦点 |
| 390 | 844 | 中文、English | 中文章节换乘、空历史、英文 reduced motion |
| 768 | 1024 | 中文、English | 英文三条历史、删除弹窗、普通结果、分享成功、十二原型 |
| 1024 | 768 | 中文、English | 英文章节换乘、中文自由切面 |
| 1280 | 900 | 中文、English | 英文双切面 |
| 1440 | 900 | 中文、English | 英文最长题、结果页 200% 缩放 |

所有宽度的中英文首页与说明页均单独加载并检查 `lang`、标题、主标题、焦点和触控目标。状态样本还覆盖：

- 第 32 题长文案与移动端粘性导航；
- 第 24 题后的中英文章节过渡；
- `clear`、`free`、`dual` 三种结果清晰度；
- 空历史与三条历史；
- 原生删除确认对话框；
- 本地 PNG 下载与分享成功提示；
- 图鉴 12 个原型；
- 200% 页面缩放；
- `prefers-reduced-motion: reduce`。

人工查看了以下代表性证据：360 中文最长题、1024 英文章节、1280 英文双切面、1024 中文自由切面、768 英文删除弹窗与分享成功、1440 英文 200% 缩放。未见文字裁断、错误语言残留、水平滚动或控件遮挡。

## 5. 无障碍与动效

- 六个宽度的首页均通过键盘把焦点移到主开始按钮；焦点轮廓为 3px 实线并有 3px offset。
- 36 个状态中的可见按钮、链接与答题标签均不小于 44 × 44px。
- HTML `lang` 随语言切换为 `zh-CN` 或 `en`。
- 删除使用原生 `dialog`，中英文名称与按钮可由角色查询。
- 200% Chromium page scale 实测为 `2`，visual viewport 为 720 × 450，无横向溢出。
- reduced-motion 媒体查询命中；HTML 滚动行为变为 `auto`；屏幕入场动画缩短到 0.001ms；结果线路与分数线路动画为 `none`。

## 6. 分享卡与本地历史

英文普通结果生成 `FACET-PRISM.png`：

```text
142,207 bytes
PNG signature: 89 50 4E 47 0D 0A 1A 0A
```

成功提示为：

```text
Your card was baked locally. Your individual answers never left the browser.
```

分享卡下载过程没有外部请求。历史页显示 3 条 locale-neutral v2 结果；普通、自由和双切面可以分别打开。删除对话框正常显示。迁移、去重、损坏容错和全量删除由 23 项 storage 单元测试及本地 E2E 持续覆盖。

独立复核曾发现英文运行说明的第二行越过深色面板。修复后增加了 Canvas 坐标回归测试，并重新下载、人工检查真实 PNG；两行完整文案均留在深色区域内。

## 7. 证据目录

本轮临时证据位于：

```text
/Users/jojo/Documents/Codex/2026-08-24/sb/work/facet/artifacts/bilingual/
```

其中包括：

- `audit.json`：36 个状态、22 个会话、错误数组、尺寸、哈希与环境信息；
- `audit.mjs`：可重复执行的本地验收脚本；
- 23 张页面状态截图；
- 1 张实际下载的 Canvas 分享卡。

`artifacts/` 已被 `.gitignore` 排除，不进入公开仓库。

## 8. 已知限制

- 当前浏览器证据基于 Chromium，未做 Safari/WebKit 与 Firefox 的跨引擎验收。
- 中文和英文共用题目 ID、计分方向、阈值与原型中心，但这只证明实现一致，不证明跨文化心理测量等价性。
- FACET 不是经过同行评议的心理量表。本次验收不证明临床效度、重测信度或人群常模，也不支持诊断、招聘、职业选择或关系判决。
- 浏览器扩展、罕见系统字体组合和全部辅助技术没有逐一穷举。

## 9. 严重度结论

| 级别 | 数量 |
|---|---:|
| Blocker | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |

**最终结论：PASS / READY FOR PUBLIC DEPLOYMENT。** 本地版本可以进入 Task 10 的 GitHub 仓库创建与 Pages 线上验收。
