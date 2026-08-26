# Security Policy

## Supported versions

Security fixes are provided for the current `0.1.x` line. Older unreleased snapshots and locally modified copies are not supported.

## Report a vulnerability privately

Please use the repository's [private security advisory form](https://github.com/Thworry/facet-personality/security/advisories/new). Do not open a public issue for a suspected vulnerability.

FACET has no server account or answer backend: quiz state, recent results, and generated share cards stay in the browser. Local-data handling, build and dependency integrity, browser security, and accidental network behavior are still valid security concerns.

Keep reports minimal and sanitized. **Do not include personal quiz answers**, localStorage exports, authentication tokens, or unrelated personal data. A synthetic reproduction is preferred.

The maintainer aims to acknowledge a report within seven days. Remediation and disclosure timing depend on severity, exploitability, and the availability of a safe fix. This project does not currently operate a bug-bounty program or promise payment.

## 中文说明

当前 `0.1.x` 系列会接收安全修复；更早的未发布快照和自行修改的副本不在支持范围内。

请通过仓库的 [GitHub 私密安全报告页面](https://github.com/Thworry/facet-personality/security/advisories/new)提交漏洞，不要公开创建 Issue。报告中不要附带真实答题记录、localStorage 导出、认证令牌或无关个人信息，优先使用虚构的最小复现。

维护者目标是在七天内确认收到报告；修复与披露时间会根据严重程度、可利用性和安全修复的可用性决定。目前没有漏洞赏金计划，也不承诺报酬。
