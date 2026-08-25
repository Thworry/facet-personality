# FACET Public-Project Hardening and v0.1.0 Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add maintainable pull-request CI, privacy-first community health, recognizable release presentation, a solo-maintainer-safe `main` ruleset, and an honestly bounded public `v0.1.0` release.

**Architecture:** Extend the existing Pages workflow into one least-privilege verification-and-deployment pipeline with a stable `CI` check. Keep all product behavior local-first and unchanged; add repository governance, deterministic release media, and remote protections around the verified single-file application.

**Tech Stack:** TypeScript 5.9.2, Vite 7.1.3, Vitest 3.2.4, Playwright 1.55.0, pnpm 11.19.0, Node.js 24+, ESLint 10 flat config, GitHub Actions, GitHub Rulesets, GitHub Pages, GitHub Releases.

## Global Constraints

- Preserve all commits already published on `main`; never amend, rebase, squash, reset, or force-push public history to change attribution.
- Every new local commit uses `Thworry <31728500+Thworry@users.noreply.github.com>`; verify with `git show -s --format='%an <%ae>'`.
- Keep `package.json` at `version: "0.1.0"` and `private: true`; do not publish to npm.
- Runtime answers, progress, history, locale, and Canvas share cards remain browser-local; add no analytics, telemetry, remote error reporting, fingerprinting, account, or answer upload.
- FACET remains a consumer entertainment and self-reflection experience, not a peer-reviewed, clinical, diagnostic, hiring, career, or relationship decision instrument.
- Chinese and English share stable IDs and scoring only; never claim cross-cultural psychometric equivalence.
- Keep the self-contained `file://` deliverable synchronized at `/Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html` whenever `dist/index.html` changes.
- Use pull requests for the hardening branch and all changes after the `main` ruleset becomes active; required approving reviews remain exactly zero.
- Pin new GitHub Action references to full commit SHAs with version comments; Dependabot maintains npm and Actions updates.
- Do not create a release or ruleset until the pull-request `CI` context has passed and been observed through the GitHub API.

---

### Task 11: Add Linting and a Pull-Request CI Gate Before Pages Deployment

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `eslint.config.js`
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `tests/release.test.ts`

**Interfaces:**
- Consumes: existing pnpm 11.19.0 lockfile, Node 24 floor, Vitest suite, 33-test default Playwright matrix, Vite single-file build, and workflow-based Pages deployment.
- Produces: package scripts `lint`, `typecheck`, and stable Actions check context `CI`; `main` deployment jobs consume a successful `CI` job.

- [ ] **Step 1: Extend the release test with failing CI and lint assertions**

Add one test that parses `package.json`, reads `eslint.config.js`, and reads `.github/workflows/deploy-pages.yml`:

```ts
it('gates pull requests and Pages deployment behind the complete CI suite', () => {
  const pkg = JSON.parse(readText('package.json')) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const eslintConfig = readText('eslint.config.js');
  const workflow = readText('.github/workflows/deploy-pages.yml');

  expect(pkg.scripts?.lint).toBe('eslint .');
  expect(pkg.scripts?.typecheck).toBe('tsc --noEmit');
  expect(pkg.devDependencies?.eslint).toBe('10.9.1');
  expect(pkg.devDependencies?.['typescript-eslint']).toBe('8.68.0');
  expect(eslintConfig).toContain("globals.browser");
  expect(eslintConfig).toContain("globals.node");
  expect(workflow).toMatch(/pull_request:\s*\n\s*branches: \[main\]/);
  expect(workflow).toContain('name: CI');
  expect(workflow).toContain('run: pnpm lint');
  expect(workflow).toContain('run: pnpm typecheck');
  expect(workflow).toContain('run: pnpm test');
  expect(workflow).toContain('run: pnpm test:e2e');
  expect(workflow).toContain('run: pnpm build');
  expect(workflow).toContain("github.event_name != 'pull_request'");
  expect(workflow).toContain('pages: write');
  expect(workflow).toContain('id-token: write');
});
```

Extend the existing least-privilege test with exact full-SHA assertions:

```ts
expect(workflow).toContain('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1');
expect(workflow).toContain('pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86');
expect(workflow).toContain('actions/setup-node@820762786026740c76f36085b0efc47a31fe5020');
expect(workflow).toContain('actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d');
expect(workflow).toContain('actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9');
expect(workflow).toContain('actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128');
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
pnpm exec vitest run tests/release.test.ts
```

Expected: FAIL because `lint`, `typecheck`, `eslint.config.js`, the PR trigger, and the `CI` job do not exist.

- [ ] **Step 3: Install the exact lint dependencies and add scripts**

Run:

```bash
pnpm add --save-dev --save-exact \
  eslint@10.9.1 \
  @eslint/js@10.0.1 \
  typescript-eslint@8.68.0 \
  globals@17.11.0
```

Add these scripts without changing the existing build semantics:

```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "build": "tsc --noEmit && vite build"
  }
}
```

- [ ] **Step 4: Create the minimal flat ESLint configuration**

Create `eslint.config.js`:

```js
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'artifacts/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['e2e/**/*.ts'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['tests/**/*.ts', '*.config.ts', 'scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
);
```

Run `pnpm lint`. Fix only real violations reported in tracked source/config/test files; do not reformat unrelated code or weaken a rule globally unless the rule is incompatible with TypeScript semantics.

- [ ] **Step 5: Replace the workflow with a least-privilege PR and Pages pipeline**

Use this job structure and exact pinned actions:

```yaml
name: Verify and Deploy GitHub Pages

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: pages-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10
        with:
          version: 11.19.0
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm test:e2e
      - run: pnpm build

  package-pages:
    name: Package Pages
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    needs: ci
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10
        with:
          version: 11.19.0
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0
      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0
        with:
          path: dist

  deploy:
    name: Deploy Pages
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    needs: package-pages
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0
```

- [ ] **Step 6: Run Task 11 GREEN gates**

Run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm exec vitest run tests/release.test.ts
pnpm test
pnpm build
git diff --check
```

Expected: all commands PASS; Vitest reports the updated exact count; `dist/index.html` remains self-contained.

- [ ] **Step 7: Commit Task 11**

Run:

```bash
git add package.json pnpm-lock.yaml eslint.config.js .github/workflows/deploy-pages.yml tests/release.test.ts
git commit -m "ci: verify pull requests before Pages deployment"
git show -s --format='%h %an <%ae> %s'
```

Expected author: `Thworry <31728500+Thworry@users.noreply.github.com>`.

### Task 12: Add Privacy-First Security and Community Health

**Files:**
- Create: `SECURITY.md`
- Create: `.github/ISSUE_TEMPLATE/bug-report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature-request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/pull_request_template.md`
- Create: `.github/dependabot.yml`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `CONTRIBUTING.md`
- Modify: `tests/release.test.ts`

**Interfaces:**
- Consumes: GitHub private vulnerability reporting URL, existing bilingual README/contribution boundary, and the no-network runtime.
- Produces: public opt-in feedback routes, private security reporting, automated dependency PRs, and machine-checked privacy/community-health commitments.

- [ ] **Step 1: Write failing community-health and privacy tests**

Add helpers and one focused test to `tests/release.test.ts`:

```ts
it('ships privacy-first security, issue, PR, and dependency policies', () => {
  const security = readText('SECURITY.md');
  const bug = readText('.github/ISSUE_TEMPLATE/bug-report.yml');
  const feature = readText('.github/ISSUE_TEMPLATE/feature-request.yml');
  const issueConfig = readText('.github/ISSUE_TEMPLATE/config.yml');
  const pullRequest = readText('.github/pull_request_template.md');
  const dependabot = readText('.github/dependabot.yml');
  const readme = readText('README.md');
  const readmeZh = readText('README.zh-CN.md');

  expect(security).toContain('/security/advisories/new');
  expect(security).toMatch(/do not include.*quiz answers/i);
  expect(bug).toContain('Do not paste personal quiz answers');
  expect(feature).toContain('Privacy impact');
  expect(issueConfig).toContain('blank_issues_enabled: false');
  expect(pullRequest).toContain('pnpm test:e2e');
  expect(pullRequest).toMatch(/diagnos/i);
  expect(dependabot).toContain('package-ecosystem: "npm"');
  expect(dependabot).toContain('package-ecosystem: "github-actions"');
  expect(readme).toContain('Feedback and privacy');
  expect(readmeZh).toContain('反馈与隐私');
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run `pnpm exec vitest run tests/release.test.ts`.

Expected: FAIL because the six GitHub/security files and README feedback sections do not exist.

- [ ] **Step 3: Add `SECURITY.md` with a private reporting route**

State that `0.1.x` is supported, older unreleased snapshots are not, and reports should use:

```text
https://github.com/Thworry/facet-personality/security/advisories/new
```

Include these exact safety points:

- do not open a public issue for a vulnerability;
- do not include personal quiz answers, localStorage exports, tokens, or unrelated personal data;
- FACET has no server account or answer backend, but local data handling and supply-chain issues remain in scope;
- acknowledgement target is seven days and remediation timing depends on severity, with no bounty promise.

- [ ] **Step 4: Add GitHub issue forms, issue configuration, PR template, and Dependabot**

`bug-report.yml` fields: consent checkbox, summary, reproduction, expected/actual behavior, language, browser/device, optional sanitized screenshots, and privacy confirmation.

`feature-request.yml` fields: use case, proposal, alternatives, privacy impact, bilingual copy/accessibility impact, and boundary confirmation.

`config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Report a security vulnerability privately
    url: https://github.com/Thworry/facet-personality/security/advisories/new
    about: Do not disclose vulnerabilities or sensitive local data in a public issue.
```

The PR template requires the exact local commands `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`, plus checkboxes for Chinese/English copy, keyboard/accessibility, local-only data, and non-diagnostic claims.

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      timezone: "Asia/Shanghai"
    open-pull-requests-limit: 5
    groups:
      development-dependencies:
        dependency-type: "development"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
      timezone: "Asia/Shanghai"
    open-pull-requests-limit: 3
```

- [ ] **Step 5: Document opt-in feedback without telemetry**

Add `Feedback and privacy` / `反馈与隐私` sections to the two README files. State that:

- taking the quiz sends nothing to GitHub;
- GitHub issues are optional and public;
- users must not include their answer set or local storage dump;
- vulnerabilities use the private advisory link;
- the project has no analytics, tracking pixel, account, or remote answer upload.

Update `CONTRIBUTING.md` with the new lint/typecheck commands and the same issue/privacy distinction.

- [ ] **Step 6: Run Task 12 GREEN gates**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm exec vitest run tests/release.test.ts
pnpm test
git diff --check
```

Also scan tracked runtime code:

```bash
rg -n 'fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|analytics|telemetry|segment|mixpanel|posthog' src index.html
```

Expected: test commands PASS; runtime scan has zero executable tracking/upload implementations.

- [ ] **Step 7: Commit Task 12**

Run:

```bash
git add SECURITY.md .github/ISSUE_TEMPLATE .github/pull_request_template.md .github/dependabot.yml README.md README.zh-CN.md CONTRIBUTING.md tests/release.test.ts
git commit -m "docs: add privacy-first community health"
git show -s --format='%h %an <%ae> %s'
```

### Task 13: Add Recognizable Release Media and Honest v0.1.0 Notes

**Files:**
- Modify: `package.json`
- Create: `scripts/capture-social-preview.mjs`
- Create: `docs/assets/social-preview.png`
- Create: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `tests/release.test.ts`

**Interfaces:**
- Consumes: `docs/assets/preview-en.png`, Playwright Chromium, existing FACET colors/copy, and the approved product boundary.
- Produces: package script `capture:social`, deterministic 1280 × 640 PNG, bilingual public presentation, and release notes consumed by `gh release create`.

- [ ] **Step 1: Write the failing media and release-note test**

Add this test to `tests/release.test.ts`:

```ts
it('contains a deterministic social card and honest v0.1.0 notes', () => {
  const social = readBytes('docs/assets/social-preview.png');
  const socialBuffer = Buffer.from(social);
  const changelog = readText('CHANGELOG.md');
  const readme = readText('README.md');
  const readmeZh = readText('README.zh-CN.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  expect(pkg.scripts?.['capture:social']).toBe('node scripts/capture-social-preview.mjs');
  expect(social.byteLength).toBeGreaterThan(20_000);
  expect([...social.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(socialBuffer.readUInt32BE(16)).toBe(1280);
  expect(socialBuffer.readUInt32BE(20)).toBe(640);
  expect(readme).toContain('docs/assets/social-preview.png');
  expect(readmeZh).toContain('docs/assets/social-preview.png');
  expect(changelog).toContain('## v0.1.0 — 2026-08-25');
  expect(changelog).toMatch(/not.*clinical|not.*diagnos/i);
  expect(changelog).toContain('cross-cultural psychometric equivalence');
  expect(changelog).not.toMatch(/users|accuracy rate|most accurate|clinically validated/i);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run `pnpm exec vitest run tests/release.test.ts`.

Expected: FAIL because the social PNG, capture script, package script, and changelog are absent.

- [ ] **Step 3: Create the deterministic social-preview renderer**

Create `scripts/capture-social-preview.mjs` using `readFile`, base64 embedding, and Playwright Chromium. It must:

- use a 1280 × 640 viewport and screenshot exactly that viewport;
- embed `preview-en.png` as a data URL so the renderer makes no network request;
- use the existing dark ink, lime, coral, and warm-paper palette;
- show `FACET / PERSONALITY FACETS`, `BILINGUAL · LOCAL-FIRST`, `32 SCENES / 6 CORE LINES / 2 RECENT SIGNALS`, and `REFLECTION, NOT DIAGNOSIS`;
- crop the real result screenshot on the right with a dark gradient boundary;
- close Chromium in `finally` and write only `docs/assets/social-preview.png`.

Add the exact script:

```json
{
  "scripts": {
    "capture:social": "node scripts/capture-social-preview.mjs"
  }
}
```

Run `pnpm capture:social`, then inspect the actual PNG at full resolution. Fix clipping, low contrast, or false hierarchy before accepting the asset.

- [ ] **Step 4: Add release presentation and boundary notes**

Place the social image directly below the language switch link in both README files, with natural-language alt text in each language. Retain the two real result screenshots later in each README.

Create `CHANGELOG.md` with `v0.1.0 — 2026-08-25`, grouped into:

- `What ships`: bilingual 32-scenario experience, stable scoring, local history, local Canvas card, single-file build, keyboard/reduced-motion support;
- `Privacy`: no account, analytics, telemetry, remote fonts, or answer upload;
- `Boundaries`: not peer-reviewed, clinically validated, or suitable for diagnosis/hiring/career/relationship verdicts; shared structure is not cross-cultural psychometric equivalence; Chromium is the automated browser target.

- [ ] **Step 5: Run Task 13 GREEN and visual gates**

Run:

```bash
pnpm capture:social
pnpm lint
pnpm typecheck
pnpm exec vitest run tests/release.test.ts
pnpm test
pnpm build
pnpm test:e2e:file
git diff --check
```

Verify `docs/assets/social-preview.png` is exactly 1280 × 640, larger than 20KB, visually legible, and free of fabricated metrics/testimonials.

- [ ] **Step 6: Commit Task 13**

Run:

```bash
git add package.json scripts/capture-social-preview.mjs docs/assets/social-preview.png CHANGELOG.md README.md README.zh-CN.md tests/release.test.ts
git commit -m "docs: add public release presentation"
git show -s --format='%h %an <%ae> %s'
```

### Task 14: Merge Through CI, Protect main, Deploy, and Publish v0.1.0

**Files:**
- Modify only if a gate finds a real defect: files owned by Tasks 11–13
- Synchronize if build bytes changed: `/Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html`
- No tracked file is created solely for remote ruleset or release state.

**Interfaces:**
- Consumes: clean hardening branch, stable `CI` job, complete local gates, `CHANGELOG.md`, verified standalone HTML, authenticated `gh` account `Thworry`, public repository, and Pages workflow.
- Produces: merged `main`, active ruleset, green final Pages deployment, public `v0.1.0` release with HTML asset, and clean local/remote state.

- [ ] **Step 1: Run the complete pre-push local acceptance gate**

Run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm test:e2e:file
git diff --check
git status --short
git log --format='%h %an <%ae> %s' main..HEAD
```

Expected: every command PASS; all new commits use the noreply identity; worktree clean.

Compare the build and user output:

```bash
shasum -a 256 dist/index.html /Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html
cmp -s dist/index.html /Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html
```

If the bytes differ, copy the verified build to the output path, repeat both commands, and record the final hash. The output path remains outside this Git repository.

- [ ] **Step 2: Push the branch and open a fully described pull request**

Run:

```bash
git push --set-upstream origin chore/public-project-hardening
gh pr create \
  --repo Thworry/facet-personality \
  --base main \
  --head chore/public-project-hardening \
  --title "chore: harden FACET for public v0.1.0" \
  --body "Adds pull-request CI, privacy-first community health, Dependabot, deterministic release media, and honest v0.1.0 notes. Runtime behavior remains local-first with no analytics or answer upload. Local gates: lint, typecheck, unit, 33-test E2E, build, and file-mode E2E."
```

- [ ] **Step 3: Wait for the PR check and verify its exact context**

Run:

```bash
FACET_PR_NUMBER="$(gh pr view --repo Thworry/facet-personality --json number --jq '.number')"
gh pr checks "$FACET_PR_NUMBER" --repo Thworry/facet-personality --watch --fail-fast
FACET_HEAD_SHA="$(gh pr view "$FACET_PR_NUMBER" --repo Thworry/facet-personality --json headRefOid --jq '.headRefOid')"
gh api "repos/Thworry/facet-personality/commits/$FACET_HEAD_SHA/check-runs" --jq '.check_runs[] | {name,status,conclusion,html_url}'
```

Expected: check run name is exactly `CI`, status is `completed`, and conclusion is `success`. `Package Pages` and `Deploy Pages` are skipped for the pull-request event.

- [ ] **Step 4: Perform an independent diff/reality gate and merge without external approval**

Review `main...HEAD` for P0/P1/P2 issues, workflow permission leaks, tracking, accidental answer uploads, false psychological claims, malformed GitHub forms, and preview legibility. Fix any real issue in a separate noreply-authored commit and repeat Steps 1–3.

When the independent gate reports zero P0/P1/P2:

```bash
gh pr merge "$FACET_PR_NUMBER" --repo Thworry/facet-personality --merge --delete-branch
git switch main
git pull --ff-only origin main
git status --short
```

Expected: the PR is merged, the remote feature branch is deleted, and local `main` is clean at the merge commit.

- [ ] **Step 5: Observe final main checks and create the active ruleset**

Wait for the merged workflow:

```bash
FACET_RUN_ID="$(gh run list --repo Thworry/facet-personality --workflow deploy-pages.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')"
gh run watch "$FACET_RUN_ID" --repo Thworry/facet-personality --exit-status
```

Create the ruleset through standard input:

```bash
gh api --method POST repos/Thworry/facet-personality/rulesets --input - <<'JSON'
{
  "name": "Protect main with CI",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "CI" }
        ]
      }
    }
  ],
  "bypass_actors": []
}
JSON
```

Query the created ruleset and verify enforcement, target, four rule types, `CI`, and zero approvals. Do not create a second ruleset if an identical active ruleset already exists.

- [ ] **Step 6: Repeat live Pages and repository verification**

Run:

```bash
curl --fail --silent --show-error --location --output /dev/null --write-out '%{http_code}\n' https://thworry.github.io/facet-personality/
PLAYWRIGHT_BASE_URL=https://thworry.github.io/facet-personality/ pnpm exec playwright test e2e/online.spec.ts --config playwright.online.config.ts
gh repo view Thworry/facet-personality --json nameWithOwner,isPrivate,licenseInfo,homepageUrl,url,description,repositoryTopics
gh api repos/Thworry/facet-personality/pages
gh api repos/Thworry/facet-personality/private-vulnerability-reporting
```

Expected: HTTP 200, online 1/1 PASS, public MIT metadata, workflow Pages with HTTPS, and private vulnerability reporting enabled.

- [ ] **Step 7: Publish and verify `v0.1.0`**

Run:

```bash
gh release create v0.1.0 \
  /Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html#FACET-v0.1.0-standalone.html \
  --repo Thworry/facet-personality \
  --target main \
  --title "FACET v0.1.0" \
  --notes-file CHANGELOG.md
```

Then verify:

```bash
gh release view v0.1.0 --repo Thworry/facet-personality --json name,tagName,isDraft,isPrerelease,publishedAt,targetCommitish,url,assets
gh api repos/Thworry/facet-personality/git/ref/tags/v0.1.0
```

Expected: public, non-draft, non-prerelease `v0.1.0`; target is the final `main`; one standalone HTML asset is downloadable.

- [ ] **Step 8: Run final local/remote consistency and cleanliness checks**

Run:

```bash
git fetch origin
git status --short
git rev-parse HEAD
git rev-parse origin/main
git config --local --get user.name
git config --local --get user.email
gh api repos/Thworry/facet-personality/rulesets
gh run list --repo Thworry/facet-personality --workflow deploy-pages.yml --limit 1 --json databaseId,status,conclusion,headSha,url
gh release view v0.1.0 --repo Thworry/facet-personality --json tagName,url,assets
```

Expected: clean worktree; identical local and remote `main`; author `Thworry` with `31728500+Thworry@users.noreply.github.com`; active ruleset; final workflow success at the release commit; live release and asset.

- [ ] **Step 9: Report the release timeline**

Report in Asia/Shanghai time:

- Task 11–14 completion timestamps and commits;
- PR URL and exact successful `CI` check;
- final Pages run URL and online smoke count;
- active ruleset name and rules;
- release URL, tag, target commit, and standalone asset;
- unit, E2E, file, online, lint, typecheck, build, privacy scan, and visual-review results;
- local output path, final bytes, SHA-256, and clean-worktree confirmation.
