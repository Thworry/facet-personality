# Contributing to FACET

[中文说明](#中文说明)

Thanks for helping make FACET clearer, kinder, and sturdier. Small, well-explained changes are easier to review than a suitcase full of unrelated ideas.

## Before opening an issue

- Search existing issues first.
- For bugs, include the browser, viewport, language, exact steps, expected result, and actual result.
- For copy changes, quote the current line and explain the ambiguity or tone problem.
- Keep personal quiz results private. A minimal synthetic example is enough for storage or scoring bugs.
- Security reports do not belong in a public issue. Use the repository's [private security advisory form](https://github.com/Thworry/facet-personality/security/advisories/new) and follow [SECURITY.md](SECURITY.md).
- GitHub issues are optional and public. Never paste real answer sets, result history, localStorage exports, tokens, or unrelated personal data.

## Branches and commits

Create a focused branch from `main`. Use short, descriptive commit messages such as `fix: preserve locale after reload` or `docs: clarify score boundaries`. Do not mix generated previews, copy rewrites, scoring changes, and unrelated formatting in one commit.

## Local checks

The project requires Node.js 24 or newer and pnpm 11.19.0. These are the standard project commands:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Stop the development server before running the browser suite if both would use the same port. A pull request should pass lint, type checking, unit tests, browser tests, and the production build.

On a fresh machine, run `pnpm exec playwright install chromium` once before the browser suite.

## Copy, scoring, and privacy rules

- Keep question IDs, dimensions, directions, and timeframes language-neutral.
- Keep Chinese and English catalogs structurally complete. English should read like English, not like Chinese wearing a borrowed coat.
- Do not make diagnostic, clinical, hiring, career-fit, relationship-compatibility, or accuracy claims.
- Keep humor out of questions, privacy notices, deletion dialogs, errors, disclaimers, and scoring explanations.
- Do not add analytics, answer uploads, remote fonts, or third-party runtime assets.
- Scoring or threshold changes need focused tests and a plain-language explanation in the pull request.

## Pull request checklist

- [ ] The change has one clear purpose and links to a relevant issue when one exists.
- [ ] Chinese and English behavior still match where the feature is shared.
- [ ] New or changed behavior has tests.
- [ ] `pnpm test`, `pnpm test:e2e`, and `pnpm build` pass locally.
- [ ] Keyboard use, 44px targets, reduced motion, and narrow screens were considered for UI changes.
- [ ] No user answer data or unrelated local storage is exposed or deleted.
- [ ] Documentation and previews are updated when the visible product changed.

# 中文说明

感谢你帮 FACET 把话说清楚、把交互做扎实。范围明确的小改动最容易审，也最不容易在行李箱底下翻出一只无关的重构。

## 提交 Issue 前

- 先搜索已有 Issue，避免重复。
- 报告问题时，请写明浏览器、视口、语言、复现步骤、预期结果和实际结果。
- 修改文案时，请贴出原句，并说明它哪里含糊、别扭或不符合语气。
- 不要公开自己的完整测试结果。存储或计分问题使用最小化的虚构示例即可。
- 安全问题不要放在公开 Issue。请使用仓库的 [GitHub 私密安全报告页面](https://github.com/Thworry/facet-personality/security/advisories/new)，并遵守 [SECURITY.md](SECURITY.md)。
- GitHub Issue 完全自愿且内容公开。不要粘贴真实答案、结果历史、localStorage 导出、令牌或无关个人信息。

## 分支与提交

从 `main` 创建单一目的的分支。提交信息保持简短明确，例如 `fix: preserve locale after reload` 或 `docs: clarify score boundaries`。生成预览图、重写文案、修改计分和无关格式化不要塞进同一个提交。

## 本地检查

项目需要 Node.js 24 或更高版本，以及 pnpm 11.19.0。统一使用以下命令：

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

如果开发服务器和浏览器测试会占用同一端口，请先停掉开发服务器。拉取请求至少应通过 lint、类型检查、单元测试、浏览器测试和生产构建。

第一次在新环境运行时，请先执行一次 `pnpm exec playwright install chromium`，再跑浏览器测试。

## 文案、计分与隐私规则

- 题目 ID、维度、方向和时间范围必须与语言无关。
- 中英文目录结构必须完整一致。英文要像自然英文，中文也别长成翻译腔。
- 不得加入诊断、临床、招聘、职业适配、关系匹配或准确率声明。
- 题目、隐私说明、删除确认、错误、免责声明与计分解释中不使用幽默文案。
- 不得增加统计脚本、逐题答案上传、远程字体或第三方运行时资源。
- 修改计分或阈值时，必须补充聚焦测试，并在拉取请求中用普通语言解释影响。

## 拉取请求清单

- [ ] 改动只有一个清楚目的，并在适用时关联 Issue。
- [ ] 共享功能的中英文行为仍然一致。
- [ ] 新增或改变的行为有测试覆盖。
- [ ] 本地已通过 `pnpm test`、`pnpm test:e2e` 和 `pnpm build`。
- [ ] UI 改动已考虑键盘、44px 目标、减少动态效果与窄屏。
- [ ] 没有泄露用户答案，也没有误删无关本地数据。
- [ ] 可见产品发生变化时，文档与预览图已同步更新。
