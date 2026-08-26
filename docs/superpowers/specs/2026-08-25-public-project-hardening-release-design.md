# FACET Public-Project Hardening and v0.1.0 Release Design

## Status and authority

This design is an incremental follow-up to the completed bilingual open-source release. Tasks 1–10 in `docs/superpowers/plans/2026-08-24-bilingual-open-source-release.md` are already complete; the public repository, GitHub Pages site, MIT license, bilingual application, local single-file artifact, and automated browser coverage are retained as-is.

The user authorized autonomous execution of the requirements below and asked to pause only for a major irreversible action or a conflict with the approved product design. No such conflict exists. This document therefore records the selected defaults before implementation rather than reopening finished product decisions.

## Goal

Prepare FACET for maintainable public collaboration and publish an honest `v0.1.0` release without adding tracking, weakening its local-first privacy model, rewriting public history, or presenting the experience as a clinical instrument.

## Current baseline

- Local and remote `main` are clean and identical at `615453e3496b006db7ec025384452a5ed1601fd4`.
- The repository is public at `https://github.com/Thworry/facet-personality` and licensed under MIT.
- GitHub Pages is live at `https://thworry.github.io/facet-personality/` through a workflow-based deployment.
- The current automated baseline is 94 unit tests, 33 local HTTP browser journeys, one direct `file://` journey, and one online Pages smoke journey.
- The repository has no ruleset and no published GitHub release.
- Private vulnerability reporting is enabled, but the repository does not yet contain `SECURITY.md`, issue forms, a pull-request template, or Dependabot configuration.
- Existing preview images are real bilingual result screens. GitHub currently uses its generated Open Graph card rather than a custom project image.
- The package is already versioned `0.1.0` and remains `private: true`; this project is not an npm package.

## Considered approaches

### Approach A — One workflow for PR verification and Pages deployment (selected)

Extend the existing Pages workflow so every pull request runs a single required `CI` job covering lint, type checking, unit tests, Chromium E2E, and the production build. On `main`, the same verification runs before a separately permissioned Pages packaging and deployment path.

This keeps one source of truth, gives the ruleset one stable required check, and prevents untrusted pull-request jobs from receiving Pages write permissions. It repeats the final build in the packaging job, which is acceptable for this small static project.

### Approach B — Separate CI and Pages workflows

Add a PR-only CI workflow and leave the current push-only Pages workflow intact. This is straightforward but duplicates installation and all tests after every merge, and the two workflows can drift.

### Approach C — Reusable workflow composition

Create reusable verification and deployment workflows. This is flexible but adds indirection that a single-maintainer static project does not yet need.

Approach A is selected because it has the smallest long-term maintenance surface while preserving least-privilege deployment.

## CI and developer checks

The repository will expose these exact package scripts:

- `pnpm lint` runs ESLint across TypeScript, JavaScript, and module scripts.
- `pnpm typecheck` runs `tsc --noEmit`.
- `pnpm test` runs the Vitest suite.
- `pnpm test:e2e` runs the existing 33-test local Chromium matrix and continues to exclude file and online suites.
- `pnpm build` retains the existing type check before creating the single-file Vite build.

ESLint will use a small flat configuration with the official JavaScript recommendations, `typescript-eslint`, and explicit browser/Node globals. Generated output, Playwright evidence, artifacts, and dependencies remain ignored. Lint will not introduce opinionated formatting churn.

The renamed-but-continuous `.github/workflows/deploy-pages.yml` will trigger on:

- pull requests targeting `main`;
- pushes to `main`;
- manual dispatch.

The `CI` job receives only `contents: read`. It installs the locked pnpm dependencies, installs Chromium, and runs lint, type checking, unit tests, local E2E, and build in that order. Pages packaging and deployment run only for `main` push/manual events after `CI` succeeds, and only those jobs receive `pages: write` and `id-token: write`.

Stable GitHub Action releases will be pinned to full commit SHAs with readable version comments. New npm tooling will use exact stable versions that have cleared the repository's minimum-release-age policy; Dependabot will keep both npm and GitHub Action references current.

## Main-branch ruleset

The `main` ruleset will be created only after the pull-request workflow has produced a successful check and the exact check context has been observed through the GitHub API.

The active branch ruleset will:

- target only the default `main` branch;
- prohibit branch deletion;
- prohibit non-fast-forward updates and force pushes;
- require changes to arrive through a pull request;
- require the observed `CI` status check with strict branch freshness;
- require zero approving reviews, no code-owner review, and no last-push approval.

This gives a solo maintainer a real PR and CI gate without requiring another person. The repository owner can still edit or disable the ruleset through repository administration if a broken workflow requires recovery; no bypass actor will silently skip normal checks.

## Community health and security files

The repository will add:

- `SECURITY.md` with supported-version policy, private advisory reporting instructions, response expectations, and local-data/privacy guidance;
- `.github/ISSUE_TEMPLATE/bug-report.yml` with reproducibility, browser, language, and privacy-safe diagnostic fields;
- `.github/ISSUE_TEMPLATE/feature-request.yml` with use case, proposal, privacy impact, and bilingual-copy impact;
- `.github/ISSUE_TEMPLATE/config.yml` disabling blank issues and routing vulnerabilities to private reporting;
- `.github/pull_request_template.md` covering verification commands, bilingual copy, accessibility, local-first privacy, and non-diagnostic claims;
- `.github/dependabot.yml` with grouped weekly npm updates and monthly GitHub Actions updates.

Issue submissions are public and voluntary. Templates will explicitly tell contributors not to paste personal quiz answers, browser storage dumps, authentication material, or other sensitive information. Security reports go through GitHub private vulnerability reporting.

## Privacy-compatible feedback

FACET will continue to make zero runtime analytics or telemetry requests. No consent banner, fingerprinting, remote error reporting, or hidden usage counter will be introduced.

The README files will document an opt-in feedback path through GitHub issues and clearly state that issue contents are public. Users who only take the quiz do not contact GitHub and do not transmit answers. Security concerns use the private advisory channel.

Release-package tests and final static/browser scans will continue to verify that the production artifact has no executable external resources, analytics, or answer-upload endpoint.

## Recognizable project presentation

Existing `docs/assets/preview-zh.png` and `docs/assets/preview-en.png` remain the primary real-product demonstrations. A deterministic `1280 × 640` `docs/assets/social-preview.png` will be composed from the established FACET visual system and an existing real result preview; it will not fabricate usage numbers, ratings, research claims, or testimonials.

The social image will communicate:

- FACET / Personality Facets;
- bilingual and local-first operation;
- 32 everyday scenarios, six core lines, and two recent-state signals;
- an explicit “reflection, not diagnosis” boundary.

The English and Chinese README entry points will display or link the asset, retain their existing real screenshots, and describe FACET as a consumer personality-reflection experience rather than a psychological assessment. If authenticated GitHub UI access permits a safe upload, the same asset may be configured as the repository custom social preview; the checked-in asset and README presentation are the required outcome.

## v0.1.0 release

`CHANGELOG.md` will record the initial public release. The GitHub release will target the final merged `main` commit, use tag `v0.1.0`, and attach the verified standalone HTML artifact from `/Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html`.

Release notes will state:

- bilingual Chinese/English presentation over the same stable scoring model;
- local-only answers, progress, history, and Canvas share-card generation;
- responsive, keyboard, reduced-motion, and single-file support;
- no analytics or account requirement;
- FACET is for entertainment and self-reflection, is not peer-reviewed or clinically validated, and must not be used for diagnosis, hiring, career decisions, or relationship verdicts;
- shared scoring structure does not establish cross-cultural psychometric equivalence;
- Chromium is the fully automated browser target for `v0.1.0`.

The release will not publish to npm and will not claim user counts, reliability statistics, prevalence, or diagnostic accuracy.

## Commit attribution and history

Repository-local Git author configuration will be:

```text
Thworry <31728500+Thworry@users.noreply.github.com>
```

All new commits must use this identity and be verified before push. Existing public commits will not be amended, rebased, squashed, or force-pushed solely to change attribution.

## Delivery sequence

1. Create the hardening branch from the clean public `main` baseline and commit this design and its implementation plan.
2. Add lint/CI, community-health files, privacy feedback documentation, the social asset, changelog, and tests in reviewable commits.
3. Run the complete local gate, sync and hash the standalone output if the build changes, then push the branch and open a pull request.
4. Wait for the pull-request `CI` check, independently review the diff, and merge without requiring an external approval.
5. Observe the actual check context, create the active `main` ruleset, and verify deletion/non-fast-forward/PR/status-check rules.
6. Wait for the merged Pages deployment, repeat HTTP and online browser smoke checks, and publish `v0.1.0` with the standalone artifact.
7. Verify release assets, repository metadata, community-health files, default branch, Pages, ruleset, commit author configuration, and a clean local worktree.

## Acceptance criteria

- The feature branch is merged through a pull request whose `CI` check passed.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `pnpm test:e2e:file`, and the online Pages smoke all pass with recorded counts.
- The Pages workflow uses least-privilege job permissions and deploys only verified `main` commits.
- The active ruleset protects `main` from deletion and force pushes, requires a pull request and the successful `CI` context, and requires zero approvals.
- All security, issue, PR, and Dependabot files render as valid GitHub configuration.
- Runtime and built-artifact scans find no analytics, telemetry, remote fonts, answer upload, or unexpected third-party requests.
- The 1280 × 640 social asset is deterministic, legible, and uses no fabricated claims.
- The public `v0.1.0` release has honest boundary notes and the verified standalone HTML asset.
- Local `HEAD`, `origin/main`, the release target, the final successful Pages run, and the online site all correspond to the same release commit.
- The worktree is clean and future commit author identity is the GitHub noreply address.
