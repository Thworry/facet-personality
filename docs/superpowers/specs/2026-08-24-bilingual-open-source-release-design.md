# FACET 双语文案与 GitHub 开源发布设计规格

> 版本：1.0
>
> 日期：2026-08-24
>
> 状态：待用户书面复核
>
> 目标仓库：`https://github.com/Thworry/facet-personality`
>
> 目标体验地址：`https://thworry.github.io/facet-personality/`

## 1. 背景

FACET 当前是一个通过独立验收的本地人格自我观察网页：32 道题、6 个核心维度、2 个近期状态维度、12 个原创原型、四种天气、双切面与自由切面、本地历史和 Canvas 分享卡。项目使用 Vanilla TypeScript、Vite、Vitest 与 Playwright，可构建为单个自包含 HTML；当前门禁为 47 项单元测试和 15 项 Chromium E2E 全部通过。

本轮不重新设计测量模型。目标是在保持中性题干和娱乐边界的前提下，让产品语言更活泼、幽默、自然，并把完整源码整理为真正可阅读、可运行、可贡献、可在线体验的中英双语 GitHub 开源项目。

## 2. 目标与非目标

### 2.1 目标

1. 网页完整支持 `中文` 与 `English` 两种语言，用户可在所有页面切换。
2. 中文采用“观察敏锐的朋友式旁白”，英文采用 warm, dry wit；两者都按各自语言习惯重写，不做逐字翻译。
3. 32 道题在两种语言中保持相同的题号、维度、正反向和时间范围。
4. 12 个原型、结果解释、图鉴、天气、分享卡、历史与系统反馈全部双语化。
5. 切换语言不重置答案、不重复创建历史、不改变计算结果。
6. 创建公开 GitHub 仓库 `Thworry/facet-personality`，采用 MIT License。
7. 通过 GitHub Actions 自动构建并发布 GitHub Pages，README 中可直接进入在线体验。
8. 在发布前通过双语单元、E2E、响应式、无障碍、隐私和线上冒烟测试。

### 2.2 非目标

- 不增加账号、后端、云同步、分析、广告、排行榜或支付。
- 不改变维度、反向计分、原型中心、清晰度阈值、天气阈值或突出切面规则。
- 不声称心理测量学效度、准确率、稀有度或诊断价值。
- 不增加自动翻译服务、远程字体、第三方文案 API 或运行时网络依赖。
- 不把本轮扩展为多于中文和英文的通用翻译平台。

## 3. 语言与幽默原则

### 3.1 共同原则

- 题目负责测量，旁白负责性格：幽默不进入题目计分含义。
- 有梗但不攻击身份、疾病、家庭、创伤、收入、教育或能力。
- 不用“天生、注定、真正的你、最稀有”等绝对词。
- 锐评后必须给出行为证据、优势和可执行建议。
- 每个屏幕最多安排一处明显笑点，其余文字为笑点服务，避免句句抖机灵。
- 法律、隐私、删除与娱乐用途声明保持直接、清晰，不用玩笑稀释边界。

### 3.2 中文语气

中文像一个观察很准、嘴上轻轻吐槽但知道分寸的朋友。使用现代自然口语，避免企业宣传腔、翻译腔、过度网络黑话和短期热梗。

建议语感示例：

- 首页：`不测你是不是天选之子，只看看你的系统默认怎么跑。`
- 作答说明：`理想人设可以先去喝口水，这里只看平时真正会上线的你。`
- 近期章节：`核心线路读完。接下来看看最近两周，后台是不是偷偷开了太多进程。`
- 结果说明：`你的运行说明书——没有保修卡，但有使用建议。`
- 分享成功：`分享卡已经烤好，逐题答案没有离开浏览器半步。`

### 3.3 英文语气

英文采用自然、温暖、略带干式幽默的产品文案。避免逐字翻译中文成语、硬塞中文互联网梗或使用不自然的营销夸张。

建议语感示例：

- Landing: `No destiny. No rarest-type leaderboard. Just a closer look at your default settings.`
- Intro: `Let your aspirational alter ego take a coffee break. Answer for the version of you that actually shows up.`
- Weather chapter: `Core route mapped. Now let’s check what has been running in the background for the past two weeks.`
- Result: `Your operating notes — warranty not included, practical guidance included.`
- Share success: `Your card was baked locally. Your individual answers never left the browser.`

### 3.4 题目语言边界

- 现有 32 道中文题干不改字、不加笑点。
- 英文题目采用语义转写而非逐词翻译，但必须保留原题的行为对象、肯定或否定方向和时间框架。
- 英文反向题不得因双重否定改变计分含义。
- 核心题统一使用通常情境；W1/W2 题必须明确使用 `Over the past two weeks` 或自然等价表达。
- 两种语言均沿用五级量尺；英文为 `Not like me at all / Not much like me / Somewhere in the middle / Mostly like me / Very much like me`。

## 4. 国际化架构

### 4.1 支持语言与默认选择

```ts
export type Locale = 'zh-CN' | 'en';
```

选择优先级：

1. `facet:v1:locale` 中的有效值；
2. 浏览器首选语言以 `zh` 开头时使用 `zh-CN`；
3. 其他情况使用 `en`。

切换后立即更新：

- 当前页面文字；
- `<html lang>`；
- `document.title` 与页面描述；
- 键盘提示和所有可访问名称；
- 结果页、历史、图鉴和随后生成的分享卡。

语言选择保存在本地，不上传，也不写入答题进度或结果历史。

### 4.2 文件边界

```text
src/i18n/
├── types.ts             # Locale、LocaleCatalog 与所有 copy key
├── locale.ts            # 检测、读取、保存和校验 locale
├── catalog.ts           # getCatalog(locale) 与完整性保护
└── locales/
    ├── zh-CN.ts         # 中文自然文案
    └── en.ts            # 英文自然文案
```

`LocaleCatalog` 必须覆盖：

- 元数据、导航、按钮、提示、错误、免责声明；
- 32 道题与五级量尺；
- 8 个维度的名称、两端标签与解释；
- 4 种天气；
- 12 个原型的名称、hook、3 个优势、3 个翻车点、关系需求和一周行动；
- 清晰度、自由切面、突出切面与结果章节标题；
- 图鉴、历史、删除确认和分享卡文案。

测试必须证明两个 catalog key 完全一致，不能依赖运行时静默回退掩盖漏译。开发环境遇到缺 key 时抛出可读错误；生产构建因完整性测试而不应出现缺 key。

### 4.3 领域数据与文案解耦

评分不再依赖中文字符串：

- `src/data/questions.ts` 只保存 `id / dimension / direction / timeframe`；界面按 `id` 从 catalog 取题干。
- `src/data/archetypes.ts` 只保存 `code / pattern`；名称和描述按 `code` 从 catalog 取值。
- `FacetResult` 的 `primary / adjacent` 只保存 `{ code, distance }`，`standout` 不再保存展示标签；历史只保存分数、代码、距离、清晰度、天气和突出维度，不保存某一种语言的展示文案。
- 结果、图鉴、历史与分享卡在渲染时使用当前 catalog，因此切换语言后同一结果会立即换语言，且不会产生重复历史。

新历史使用带 `version: 2` 的语言无关结构，写入 `facet:v2:history`。首次加载时如新 key 不存在，则读取现有 `facet:v1:history` 富文案对象，按稳定 `code`、分数和模式规范化后写入 v2；同一 `id` 不重复，仍只保留最近 3 条。损坏记录继续按现有防御策略忽略，不阻止用户完成测试。迁移成功后可以保留旧 key 作为回滚保险，但所有后续读写只使用 v2。

### 4.4 状态与渲染接口

`AppState` 新增 `locale: Locale` 与动作：

```ts
{ type: 'SET_LOCALE'; locale: Locale }
```

所有 renderer 改为显式接收 catalog，禁止模块内部直接访问全局语言：

```ts
renderLanding(copy: LocaleCatalog): string
renderQuiz(state: AppState, copy: LocaleCatalog): string
renderResult(result: FacetResult, copy: LocaleCatalog, shareMessage?: string): string
drawShareCard(ctx: ShareCanvasContext, result: FacetResult, copy: LocaleCatalog, scale?: number): void
```

controller 负责切换语言、更新文档元数据、保存 locale 和重新渲染；领域评分函数保持纯函数且不知道当前语言。

## 5. 交互与版式

### 5.1 语言切换器

- 所有主屏幕顶部提供 `中文 / English` 文本切换器。
- 当前语言使用文字和形状共同标记，不能只靠颜色。
- 每个目标至少 44×44px，键盘可达，具备清晰 `aria-pressed` 或等价语义。
- 切换后保持当前路由、题号、答案、结果和滚动上下文；结果页可回到顶部重新读，但不能返回首页。
- 切换动作使用简短 `aria-live` 提示，不弹 toast，不抢焦点。

### 5.2 英文响应式

- 英文标题使用现有系统 serif 栈，正文使用系统 sans；不加载远程字体。
- 英文正文最大行长 65–75 字符；按钮允许换行但不得截断。
- 360、390、768、1280 宽度均不得横向溢出。
- 12 个原型、五级量尺、结果章节和分享卡必须使用真实最长英文文案检查。
- 现有“中文独立杂志 × 城市线路图”视觉方向保留；英文版本表现为 editorial transit field，不另做一套主题。

### 5.3 幽默密度

幽默重点进入：首页辅助文案、作答说明、章节转场、结果章节引导、空历史、分享成功和重测动作。

幽默不进入：32 道题、隐私说明、删除确认、错误恢复说明、免责声明和计分解释公式。

## 6. GitHub 开源仓库设计

### 6.1 仓库元数据

- Owner：`Thworry`
- Repository：`facet-personality`
- Visibility：Public
- License：MIT
- Copyright：`2026 Thworry`
- Description：`A bilingual, local-first personality reflection quiz with 32 everyday scenarios.`
- Homepage：`https://thworry.github.io/facet-personality/`
- Topics：`personality-quiz`, `bilingual`, `typescript`, `vite`, `local-first`, `accessibility`, `github-pages`

### 6.2 开源文件

```text
README.md                 # 英文默认说明，顶部链接中文版本
README.zh-CN.md           # 自然中文说明，顶部链接英文版本
LICENSE                   # MIT
CONTRIBUTING.md           # 双语贡献入口、开发与测试规范
CODE_OF_CONDUCT.md        # Contributor Covenant，英文正文＋中文入口说明
.github/workflows/
└── deploy-pages.yml      # 构建与 Pages 发布
docs/assets/
├── preview-zh.png        # 中文首页/结果预览
└── preview-en.png        # 英文首页/结果预览
```

README 必须包含：产品定位、在线体验、功能、隐私、娱乐边界、本地开发、测试命令、评分透明度、截图、贡献方式、License，以及中英文互链。英文 README 不应是中文句式的直译，中文 README 不应保留不必要的英文技术营销腔。

### 6.3 GitHub Pages

`deploy-pages.yml` 在 `main` 分支 push 时：

1. checkout；
2. 安装项目锁定的 Node/pnpm 环境；
3. `pnpm install --frozen-lockfile`；
4. 安装锁定版本的 Playwright Chromium；
5. `pnpm test`；
6. `pnpm test:e2e`；
7. `pnpm build`；
8. 上传 `dist/` Pages artifact；
9. 使用官方 `actions/deploy-pages` 发布。

工作流使用并发组避免旧部署覆盖新部署，只申请 `contents: read`、`pages: write` 与 `id-token: write`。不写个人 token，不上传用户数据。单文件构建不依赖仓库子路径资源，因此可直接在 `/facet-personality/` 下运行。

远程创建与发布顺序：

1. 创建 public repo 并推送完整提交历史；
2. 设置 description、homepage 和 topics；
3. 启用 workflow-based Pages；
4. 等待 Actions 完成；
5. 读取 Actions 日志并确认成功；
6. 用真实浏览器访问 Pages URL，完成中英切换、开始测试和至少第一题；
7. 把最终在线地址写回 README 后再次推送并确认部署。

## 7. 测试与验收

### 7.1 单元测试

- 两个 locale catalog 的 key、问题数量、原型数量和数组长度完全一致；
- 每种语言恰好 32 道题、12 个原型、8 个维度、4 种天气；
- 题目 ID 到维度、方向和时间范围的评分元数据不因语言变化；
- locale 检测、非法值回退、本地记忆与切换动作；
- 结果历史为语言无关结构，切换语言不新增记录；
- 分享卡在两种语言均绘制主原型、相邻切面、天气、突出切面和免责声明；
- 英文反向题与最近两周题的映射不变；
- 旧历史规范化、v2 迁移、同 ID 去重与损坏数据容错；
- “删除全部本地数据”同时清除进度、v1/v2 历史和 locale 偏好。

### 7.2 E2E

- 中文移动端完整 32 题旅程；
- 英文移动端完整 32 题旅程；
- 桌面端切换语言后保留题号和答案；
- 结果页切换语言后原型代码、分数和历史数量不变，展示文案改变；
- 中英文图鉴各显示 12 项；
- 中英文分享卡均下载有效 PNG；
- 刷新后恢复语言、进度和答案；
- 键盘、删除确认、reduced-motion 和无外部请求继续通过。

### 7.3 视觉与语言复核

- 360、390、768、1280 检查中文和最长英文状态；
- 首页、说明、题目、章节、双切面、自由切面、天气交界、图鉴、历史和删除对话框均截图复核；
- 中英文都由自然语言视角复查：无直译腔、无文化不通的梗、无遗漏占位符；
- 正文至少 16px、交互目标至少 44px、焦点对比和文本对比继续达到现有门禁；
- HTML `lang`、标题和可访问名称随语言切换。

### 7.4 线上发布门禁

- GitHub Actions 绿色通过；
- Pages URL 返回 200；
- 线上页面 0 console error、0 failed request、0 third-party request；
- 中英切换、欢迎页、说明页和第一题可操作；
- GitHub 仓库 public、MIT License 可见、README 双语互链有效；
- 仓库 About 中显示 Pages 地址；
- 最终本地单文件 HTML 同步更新并继续通过 `file://` 直开。

## 8. 错误处理与回退

- 无效 locale 值回退到浏览器语言，不让应用白屏。
- catalog 缺 key 由测试阻断发布；生产不静默显示 key 字符串。
- locale 存储失败只影响记忆，不影响当前会话切换。
- 用户确认“删除全部本地数据”后，清除进度、`facet:v1:history`、`facet:v2:history` 与 `facet:v1:locale`，当前语言回到浏览器检测结果；删除确认文案明确说明这一范围。
- GitHub Actions 失败时保留上一次成功 Pages 版本，读取日志后修复，不强行绕过测试。
- Pages 暂时未就绪时，README 明确保留本地运行方法；只有真实 URL 验证成功后才宣称“在线可用”。
- GitHub 远程仓库创建成功但发布失败时不删除仓库或重写历史，采用后续修复提交。

## 9. 完成定义

同时满足以下条件才算完成：

1. 中文与英文完整覆盖，无缺 key、无题目映射变化；
2. 两种语言都通过单元、E2E、响应式、无障碍、隐私和分享卡验证；
3. 本地单文件版本更新并通过 `file://`；
4. `Thworry/facet-personality` 为公开 MIT 仓库，完整源码和提交历史可见；
5. GitHub Pages 在线地址可从 README 和仓库 About 打开；
6. 在线中英切换与首题旅程经过真实浏览器验证；
7. 无 blocker、high 或 medium 级未解决问题。

## 10. 已知产品边界

双语化提升可访问范围，不提升心理测量学效度。英文题目完成语言复核后，仍需要独立预测、重测和跨语言等值性研究，才能讨论不同语言结果是否可直接比较。MVP 只承诺两种语言使用同一透明计分模型，不宣称已完成跨文化量表验证。
