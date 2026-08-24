# FACET Bilingual Open-Source Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship FACET as a fully bilingual Chinese/English, local-first personality reflection app and publish the verified source as the public MIT-licensed `Thworry/facet-personality` GitHub Pages project.

**Architecture:** Keep scoring and persistence language-neutral, and inject one complete typed `LocaleCatalog` into every renderer and Canvas formatter. Migrate legacy rich-copy history into a versioned v2 result schema, preserve the single-file Vite build, then add deterministic unit/E2E gates before any remote GitHub operation.

**Tech Stack:** Vanilla TypeScript 5.9, Vite 7, vite-plugin-singlefile, Vitest 3, Playwright 1.55, HTML/CSS/Canvas, pnpm 11.19.0, Node.js 24, GitHub Actions, GitHub Pages, GitHub CLI.

## Global Constraints

- Support exactly `zh-CN` and `en`; locale priority is valid `facet:v1:locale`, then a browser language beginning with `zh`, then English.
- Keep all 32 Chinese question prompts unchanged; English prompts preserve question ID, dimension, direction, behavior, and timeframe, with W1/W2 explicitly framed as the past two weeks.
- Do not change the 8 dimensions, reverse scoring, 12 archetype centers, clarity thresholds, weather thresholds, or standout rules.
- Humor belongs in onboarding, transitions, results, empty states, share success, and retest copy—not in question prompts, privacy, deletion, errors, disclaimers, or scoring explanations.
- Chinese voice is an observant, lightly teasing friend; English voice is warm, natural, and dry-witted rather than a literal translation.
- Keep the approved editorial transit-field art direction, local system fonts, warm paper/ink/coral/acid palette, and 32-station route motif; add no remote runtime assets or dependencies.
- All interaction targets are at least 44×44px; verify widths 360, 390, 768, 1024, 1280, and 1440px, 200% zoom, keyboard use, and reduced motion.
- Preserve local-only computation, a maximum of three history entries, Canvas-only share-card generation, and the entertainment/non-diagnostic boundary.
- The repository is public `Thworry/facet-personality`, licensed MIT with copyright `2026 Thworry`, and deployed to `https://thworry.github.io/facet-personality/`.
- Do not create, push, configure, or publish the GitHub repository before Task 10.
- Use TDD, keep each task independently testable, and commit after every green task.

## File Map

| Path | Responsibility |
|---|---|
| `src/types.ts` | Language-neutral domain types, locale-independent result references, stable archetype codes. |
| `src/data/questions.ts` | Question scoring metadata only: `id`, `dimension`, `direction`, `timeframe`. |
| `src/data/archetypes.ts` | Archetype scoring metadata only: `code`, six-level pattern. |
| `src/data/copy.ts` | Removed after its dimension/weather copy moves into locale catalogs. |
| `src/i18n/types.ts` | `Locale`, catalog sections, fixed-length tuple types, and copy interfaces. |
| `src/i18n/locale.ts` | Locale validation, browser detection, storage read/write, and fallback behavior. |
| `src/i18n/catalog.ts` | Catalog registry and `getCatalog(locale)` access. |
| `src/i18n/locales/zh-CN.ts` | Complete natural Chinese UI, questions, dimensions, weather, and archetype copy. |
| `src/i18n/locales/en.ts` | Complete idiomatic English UI, questions, dimensions, weather, and archetype copy. |
| `src/app/state.ts` | `locale` in `AppState`, `SET_LOCALE`, and locale-preserving resets/restores. |
| `src/app/controller.ts` | Locale bootstrap, switch actions, metadata updates, localized feedback, and catalog injection. |
| `src/app/screens/locale-switcher.ts` | Shared two-language accessible switch and polite live-status region. |
| `src/app/screens/*.ts` | Catalog-driven landing, intro, quiz, result, atlas, and history markup. |
| `src/domain/result.ts` | Pure scoring result assembly using stable codes, not display strings. |
| `src/domain/storage.ts` | Progress, v2 history envelope, v1 migration, and scoped deletion using the shared locale key. |
| `src/domain/share.ts` | Locale-aware word/character wrapping and bilingual Canvas share card. |
| `tests/i18n.test.ts` | Catalog parity, counts, question mapping, locale detection/persistence. |
| `tests/result.test.ts` | Language-neutral result and standout assertions. |
| `tests/storage.test.ts` | v1→v2 migration, validation, deduplication, corruption tolerance, deletion scope. |
| `tests/state.test.ts` | Locale state transitions and catalog-driven screen markup. |
| `tests/share.test.ts` | Chinese/English Canvas content and wrapping. |
| `e2e/app.spec.ts` | Full bilingual journeys, switching, history, PNG, accessibility, privacy, responsive gates. |
| `e2e/online.spec.ts` | Real GitHub Pages smoke test with request/console monitoring. |
| `src/styles/*.css` | Switcher, Latin typography, long-copy wrapping, touch targets, focus, responsive fixes. |
| `README.md`, `README.zh-CN.md` | Idiomatic English/Chinese project entry points and live demo links. |
| `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` | Open-source governance. |
| `.github/workflows/deploy-pages.yml` | Locked install, unit/E2E/build verification, Pages artifact and deployment. |
| `docs/assets/preview-zh.png`, `docs/assets/preview-en.png` | Browser-captured bilingual previews. |
| `/Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html` | Final local single-file deliverable copied from verified `dist/index.html`. |

---

### Task 1: Establish Stable Domain Contracts and Neutral Result References

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/questions.ts`
- Modify: `src/data/archetypes.ts`
- Modify: `src/domain/scoring.ts`
- Modify: `src/domain/result.ts`
- Modify: `src/domain/storage.ts`
- Modify: `src/app/screens/result.ts`
- Modify: `src/app/screens/history.ts`
- Modify: `src/domain/share.ts`
- Modify: `tests/data.test.ts`
- Modify: `tests/result.test.ts`
- Modify: `tests/storage.test.ts`
- Modify: `tests/state.test.ts`
- Modify: `tests/share.test.ts`

**Interfaces:**
- Consumes: existing `DimensionCode`, `Direction`, `Level`, scoring thresholds, and current 32 question/12 archetype metadata.
- Produces: `QuestionDefinition`, `ArchetypeCode`, `ArchetypeDefinition`, `RankedArchetypeResult`, and a `FacetResult` containing stable codes and numbers only, while temporary Chinese source records remain available until Task 5 completes catalog injection.

- [ ] **Step 1: Write failing tests for stable metadata projections and neutral results**

Add assertions equivalent to:

```ts
expect(QUESTION_DEFINITIONS).toHaveLength(32);
expect(QUESTION_DEFINITIONS.every((question) => !('prompt' in question))).toBe(true);
expect(ARCHETYPE_DEFINITIONS).toHaveLength(12);
expect(ARCHETYPE_DEFINITIONS.every((archetype) => !('name' in archetype) && !('hook' in archetype))).toBe(true);

const result = buildFacetResult(allMiddleAnswers, 'neutral', '2026-08-24T00:00:00.000Z');
expect(result.primary).toEqual({ code: expect.any(String), distance: expect.any(Number) });
expect(result.adjacent).toEqual({ code: expect.any(String), distance: expect.any(Number) });
expect(result.standout).not.toHaveProperty('label');
```

- [ ] **Step 2: Run the focused tests and confirm the old rich-copy shape fails**

Run:

```bash
pnpm exec vitest run tests/data.test.ts tests/result.test.ts
```

Expected: FAIL because the metadata-only exports and neutral result reference types do not exist, and current result references still include complete localized archetype objects and a standout label.

- [ ] **Step 3: Introduce exact language-neutral types**

Add these neutral interfaces alongside the temporary rich Chinese source interfaces, while retaining existing score types:

```ts
export type ArchetypeCode =
  | 'BUFFER' | 'BOOST' | 'NEST' | 'ARCHIVE' | 'SIGNAL' | 'PATCH'
  | 'TOWER' | 'SCOUT' | 'RADAR' | 'PRISM' | 'ROUTER' | 'BRIDGE';

export interface QuestionDefinition {
  id: number;
  dimension: DimensionCode;
  direction: Direction;
  timeframe: 'usual' | 'two-weeks';
}

export interface ArchetypeDefinition {
  code: ArchetypeCode;
  pattern: readonly [Level, Level, Level, Level, Level, Level];
}

export interface RankedArchetypeResult {
  code: ArchetypeCode;
  distance: number;
}

export interface StandoutResult {
  dimension: CoreDimension | 'BALANCED';
  direction: 'low' | 'high' | 'balanced';
}
```

For this task, retain the existing rich `QUESTIONS` and `ARCHETYPES` exports so the hard-coded Chinese screens keep compiling, and add frozen `QUESTION_DEFINITIONS`/`ARCHETYPE_DEFINITIONS` projections containing metadata only. Switch scoring to those projections. In `buildFacetResult`, map the two ranked definitions to `{ code, distance }`; in `selectStandout`, return only dimension and direction. Add `getArchetypeDefinition(code): ArchetypeDefinition` and `getLegacyArchetypeCopy(code)` for the temporary Chinese result/history/share renderers; both throw deterministic errors for an unknown code. Update the current history validator to accept the new neutral result shape under its existing key so this commit remains usable; Task 4 replaces that interim storage with explicit v1 migration and a v2 envelope. Task 5 removes the compatibility copy lookup when every renderer has a catalog.

- [ ] **Step 4: Run domain tests and the TypeScript build**

Run:

```bash
pnpm exec vitest run tests/data.test.ts tests/scoring.test.ts tests/result.test.ts tests/storage.test.ts tests/state.test.ts tests/share.test.ts
pnpm build
```

Expected: focused domain tests and build PASS. Result/history/share renderers obtain temporary Chinese display fields through `getLegacyArchetypeCopy`; no localized string is stored in `FacetResult`.

- [ ] **Step 5: Commit the neutral domain model**

```bash
git add src/types.ts src/data/questions.ts src/data/archetypes.ts src/domain/scoring.ts src/domain/result.ts src/domain/storage.ts src/app/screens/result.ts src/app/screens/history.ts src/domain/share.ts tests/data.test.ts tests/result.test.ts tests/storage.test.ts tests/state.test.ts tests/share.test.ts
git commit -m "refactor: separate FACET scoring data from copy"
```

### Task 2: Add Complete Typed Chinese and English Catalogs

**Files:**
- Create: `src/i18n/types.ts`
- Create: `src/i18n/catalog.ts`
- Create: `src/i18n/locales/zh-CN.ts`
- Create: `src/i18n/locales/en.ts`
- Create: `tests/i18n.test.ts`

**Interfaces:**
- Consumes: `QuestionDefinition.id`, `DimensionCode`, `WeatherCode`, `Clarity`, `ArchetypeCode`, and the existing Chinese source records from Task 1.
- Produces: `Locale`, `LocaleCatalog`, `CATALOGS`, and `getCatalog(locale): LocaleCatalog` for all renderers, metadata, feedback, and Canvas output.

- [ ] **Step 1: Write catalog completeness and semantic-parity tests**

Create tests that flatten object keys recursively while treating strings and fixed arrays as leaves, then assert:

```ts
expect(Object.keys(CATALOGS).sort()).toEqual(['en', 'zh-CN']);
expect(flattenKeys(CATALOGS.en)).toEqual(flattenKeys(CATALOGS['zh-CN']));
expect(Object.keys(CATALOGS.en.questions).map(Number).sort((a, b) => a - b))
  .toEqual(QUESTIONS.map(({ id }) => id));
expect(Object.keys(CATALOGS.en.archetypes).sort()).toEqual(ARCHETYPES.map(({ code }) => code).sort());
expect(Object.keys(CATALOGS.en.dimensions)).toHaveLength(8);
expect(Object.keys(CATALOGS.en.weather)).toHaveLength(4);
expect(CATALOGS.en.quiz.answerLabels).toHaveLength(5);
expect(CATALOGS.en.questions[25]).toMatch(/past two weeks/i);
expect(CATALOGS.en.questions[32]).toMatch(/past two weeks/i);
```

Also snapshot a metadata table derived from `QUESTIONS` and prove that selecting either locale never changes `id`, `dimension`, `direction`, or `timeframe`.

- [ ] **Step 2: Run the i18n tests and confirm the catalog modules do not exist**

Run:

```bash
pnpm exec vitest run tests/i18n.test.ts
```

Expected: FAIL with unresolved `src/i18n/catalog` and `src/i18n/types` imports.

- [ ] **Step 3: Define the catalog contract without permissive index signatures**

Define `Locale = 'zh-CN' | 'en'` and named sections for `meta`, `localeSwitcher`, `common`, `landing`, `intro`, `quiz`, `chapter`, `atlas`, `history`, `result`, `feedback`, `share`, `questions`, `dimensions`, `weather`, `clarity`, and `archetypes`. Use tuples for five answer labels, three strengths, and three pitfalls. Require exact records:

```ts
questions: Readonly<Record<number, string>>;
dimensions: Readonly<Record<DimensionCode, DimensionCopy>>;
weather: Readonly<Record<WeatherCode, WeatherCopy>>;
clarity: Readonly<Record<Clarity, string>>;
archetypes: Readonly<Record<ArchetypeCode, ArchetypeCopy>>;
```

`ArchetypeCopy` contains `name`, `hook`, `strengths`, `pitfalls`, `relationshipNeed`, and `action`. `LocaleCatalog.meta.locale` must be the literal locale so `Intl.DateTimeFormat` and Canvas wrapping can use it.

- [ ] **Step 4: Move Chinese copy verbatim, then apply only the approved humorous replacements**

Copy the unchanged 32 Chinese prompts from the still-present rich source records, and verify against the previous commit with:

```bash
git show HEAD^:src/data/questions.ts
git show HEAD^:src/data/archetypes.ts
```

Copy dimensions/weather from `src/data/copy.ts`, archetype copy from `src/data/archetypes.ts`, and screen strings from `src/app/screens/*.ts`. Keep the question text byte-for-byte unchanged. The source records remain temporarily duplicated until Task 5 removes them after renderer conversion. Apply these approved tone lines outside the questions:

```ts
landing.deckLead = '不测你是不是天选之子，只看看你的系统默认怎么跑。';
intro.realityCheck = '理想人设可以先去喝口水，这里只看平时真正会上线的你。';
chapter.lead = '核心线路读完。接下来看看最近两周，后台是不是偷偷开了太多进程。';
result.operatingNotes = '你的运行说明书——没有保修卡，但有使用建议。';
feedback.shareSuccess = '分享卡已经烤好，逐题答案没有离开浏览器半步。';
history.emptyLead = '档案目前很安静，连灰尘都还没来得及积。';
```

Privacy, deletion, errors, scoring explanations, and disclaimers remain direct and non-humorous.

- [ ] **Step 5: Author the complete English catalog as natural product copy**

Use these exact five labels:

```ts
['Not like me at all', 'Not much like me', 'Somewhere in the middle', 'Mostly like me', 'Very much like me']
```

Use the following exact English questions keyed 1–32:

```text
1. Even without anyone's approval, I can tell whether something matters to me.
2. When everyone around me disagrees with an important choice, I immediately start doubting my judgment.
3. A change in how others see me usually does not rewrite how I understand myself.
4. I often need other people's reactions to know whether I made the right call.
5. When something is worth doing, I usually begin before the pressure really arrives.
6. Without a clear deadline, many ideas stay stuck at “getting ready to get ready.”
7. Even when the steps are not complete, I am willing to take one small, reversible step.
8. Deadlines or other people's reminders often have to press my start button.
9. When I go somewhere or start a project, a rough route map helps me relax.
10. When a plan gets too detailed, I start to feel that it gets in the way of action.
11. When something unexpected changes, I first reorder the plan instead of improvising everything.
12. I often decide what to do once I am there, and usually do not see that as a problem.
13. After spending time with people I like, I often have more energy than I did before.
14. Even after an enjoyable gathering, I need time alone to recharge.
15. In an unfamiliar setting, I am usually willing to send the first social signal.
16. If nobody speaks to me, I rarely start a conversation just to warm up the room.
17. When someone else's emotions are intense, I can still tell which feelings are theirs and which are mine.
18. Once a relationship becomes close, I easily put the other person's needs ahead of my own by default.
19. Even in a close relationship, I can say no to something I do not want to take on.
20. To avoid disappointing someone, I often say yes first and deal with my discomfort alone later.
21. When I notice a problem, I would rather say it clearly than wait for the other person to figure it out.
22. I decide how much of the same honest thought to express based on the person and the situation.
23. Even if it may be briefly awkward, I do not like leaving an important disagreement hanging.
24. I am better at communicating through tone, timing, and what I leave unsaid than by spelling everything out at once.
25. Over the past two weeks, even small things have filled up my attention.
26. Over the past two weeks, most days I have still had some time that was not being chased by my to-do list.
27. Over the past two weeks, my mind has often kept working on unfinished tasks even while I was resting.
28. Over the past two weeks, one more unexpected task usually has not made me feel immediately overwhelmed.
29. Over the past two weeks, after a setback, I have usually returned to my rhythm fairly quickly.
30. Over the past two weeks, the feelings from one event have looped in my head for a long time.
31. Over the past two weeks, I have known which specific activities genuinely help me recover, and I have actually done them.
32. Over the past two weeks, even when I had free time, I often did not know how to get the kind of rest I needed.
```

Use the names `Buffer`, `Booster`, `Haven`, `Archive`, `Beacon`, `Fixer`, `Lookout`, `Scout`, `Radar`, `Prism`, `Router`, and `Bridge` for the codes in their existing order. Translate each existing Chinese archetype's hook, three strengths, three pitfalls, relationship need, and weekly action as complete idiomatic sentences; preserve the behavioral claim of each source field and do not introduce ability, rarity, destiny, or diagnosis claims. Use the approved English anchors verbatim:

```ts
landing.deckLead = 'No destiny. No rarest-type leaderboard. Just a closer look at your default settings.';
intro.realityCheck = 'Let your aspirational alter ego take a coffee break. Answer for the version of you that actually shows up.';
chapter.lead = 'Core route mapped. Now let’s check what has been running in the background for the past two weeks.';
result.operatingNotes = 'Your operating notes — warranty not included, practical guidance included.';
feedback.shareSuccess = 'Your card was baked locally. Your individual answers never left the browser.';
history.emptyLead = 'The archive is quiet. Even the dust has not checked in yet.';
```

Use the dimension labels `Inner Compass`, `Starting Rhythm`, `Planning Style`, `Social Recharge`, `Boundary Strength`, `Expression Strategy`, `Load Level`, and `Recovery Flexibility`. Use weather names `Clear Skies`, `Slow Fog`, `Overclocked`, and `Thunderstorm`.

- [ ] **Step 6: Register catalogs and run completeness tests**

Implement:

```ts
export const CATALOGS = { 'zh-CN': zhCN, en } as const satisfies Record<Locale, LocaleCatalog>;

export function getCatalog(locale: Locale): LocaleCatalog {
  const catalog = CATALOGS[locale];
  if (import.meta.env.DEV && catalog === undefined) {
    throw new Error(`Missing FACET locale catalog: ${locale}`);
  }
  return catalog;
}
```

Run:

```bash
pnpm exec vitest run tests/i18n.test.ts tests/data.test.ts
pnpm build
```

Expected: PASS, with no missing catalog key and no runtime fallback string.

- [ ] **Step 7: Commit the complete catalogs**

```bash
git add src/i18n tests/i18n.test.ts
git commit -m "feat: add complete Chinese and English catalogs"
```

### Task 3: Add Locale Detection, State, Metadata, and the Accessible Switcher

**Files:**
- Create: `src/i18n/locale.ts`
- Create: `src/app/screens/locale-switcher.ts`
- Modify: `src/app/state.ts`
- Modify: `src/app/controller.ts`
- Modify: `src/main.ts`
- Modify: `src/styles/components.css`
- Modify: `tests/i18n.test.ts`
- Modify: `tests/state.test.ts`

**Interfaces:**
- Consumes: `Locale`, `LocaleCatalog`, `getCatalog(locale)`, current route state, and injected `Storage`.
- Produces: `LOCALE_KEY`, `isLocale`, `detectLocale`, `saveLocale`, `SET_LOCALE`, a tested `renderLocaleSwitcher`, and synchronized document metadata; Task 5 places the shared switcher into every screen.

- [ ] **Step 1: Write failing locale priority, persistence, reducer, and markup tests**

Cover these exact cases:

```ts
expect(detectLocale(storageWith('facet:v1:locale', 'zh-CN'), ['en-US'])).toBe('zh-CN');
expect(detectLocale(emptyStorage, ['zh-Hans-CN', 'en'])).toBe('zh-CN');
expect(detectLocale(emptyStorage, ['fr-FR'])).toBe('en');
expect(detectLocale(storageWith('facet:v1:locale', 'xx'), ['en-US'])).toBe('en');
expect(saveLocale('en', writableStorage)).toBe(true);
expect(saveLocale('en', throwingStorage)).toBe(false);

const switched = reduceAppState({ ...quizState, locale: 'zh-CN' }, { type: 'SET_LOCALE', locale: 'en' });
expect(switched).toMatchObject({ route: 'quiz', index: quizState.index, answers: quizState.answers, locale: 'en' });
```

Assert the switcher contains two buttons, `data-action="set-locale"`, matching `data-locale`, `aria-pressed`, visible text `中文`/`English`, and a polite live region.

- [ ] **Step 2: Run focused tests and confirm failure**

```bash
pnpm exec vitest run tests/i18n.test.ts tests/state.test.ts
```

Expected: FAIL because locale helpers, state, and switcher do not exist.

- [ ] **Step 3: Implement deterministic locale helpers**

Use this public contract:

```ts
export const LOCALE_KEY = 'facet:v1:locale';
export function isLocale(value: unknown): value is Locale;
export function detectLocale(storage: Storage, languages: readonly string[]): Locale;
export function saveLocale(locale: Locale, storage: Storage): boolean;
```

`detectLocale` catches storage access errors, accepts only exact stored values, scans browser languages in order, treats any lowercase `zh`/`zh-...` prefix as Chinese, and otherwise returns English. `saveLocale` catches quota/security errors without changing the active in-memory locale.

- [ ] **Step 4: Add locale to app state without polluting saved progress**

Change signatures to:

```ts
createInitialState(order?: number[], locale?: Locale): AppState;
restoreAppState(progress: SavedProgress, locale: Locale): AppState;
```

Add `{ type: 'SET_LOCALE'; locale: Locale }`. `RESET` preserves the current locale; locale remains absent from `SavedProgress`. The controller determines locale once from `navigator.languages`/`navigator.language`, passes it into initial/restore state, and changes it only through `SET_LOCALE`.

- [ ] **Step 5: Implement the switcher and controller action with focus and scroll preservation**

Implement:

```ts
renderLocaleSwitcher(locale: Locale, copy: LocaleCatalog): string
```

Each button is at least 44×44px, and the active state uses text/shape plus `aria-pressed`. The module is unit-tested in this task but remains unused by hard-coded screens until Task 5. Add the controller's `set-locale` action now: cancel answer auto-advance, save the locale, dispatch without heading focus or scroll reset, rerender the same route, and attempt to focus the newly active locale button when present. Task 5 adds the live switch markup to every route and verifies the localized announcement.

- [ ] **Step 6: Synchronize document metadata after every render**

Set:

```ts
document.documentElement.lang = state.locale;
document.title = copy.meta.title;
document.querySelector('meta[name="description"]')?.setAttribute('content', copy.meta.description);
const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
if (skipLink !== null) skipLink.textContent = copy.common.skipToMain;
```

Keep the static `index.html` metadata and skip-link text useful for no-script fallback, with English as the neutral build-time default. Runtime rendering must always correct the document language, title, description, and the accessible skip-link label to the selected locale. Add a controller-level or browser assertion that switching to English replaces `跳到主要内容`; renderer-only tests cannot cover this element because it lives outside `root`.

- [ ] **Step 7: Run tests and commit**

```bash
pnpm exec vitest run tests/i18n.test.ts tests/state.test.ts
pnpm build
git add src/i18n/locale.ts src/app/screens/locale-switcher.ts src/app/state.ts src/app/controller.ts src/main.ts src/styles/components.css tests/i18n.test.ts tests/state.test.ts index.html
git commit -m "feat: add persistent locale switching"
```

Expected: PASS for locale priority, storage failure containment, state preservation, switcher semantics, metadata synchronization, and the TypeScript build.

### Task 4: Migrate History to Versioned Language-Neutral Results

**Files:**
- Modify: `src/domain/storage.ts`
- Modify: `src/app/controller.ts`
- Modify: `tests/storage.test.ts`
- Modify: `e2e/app.spec.ts`

**Interfaces:**
- Consumes: Task 1's language-neutral `FacetResult`, `ArchetypeCode`, Task 3's `LOCALE_KEY`, and existing `facet:v1:progress`/`facet:v1:history` data.
- Produces: `LEGACY_HISTORY_KEY`, `HISTORY_KEY`, `StoredHistoryV2`, idempotent `loadHistory`, v2 `appendHistory`, and scoped `clearAllLocalData`.

- [ ] **Step 1: Write failing v2 storage and migration tests**

Define the intended constants and envelope in the test:

```ts
expect(LEGACY_HISTORY_KEY).toBe('facet:v1:history');
expect(HISTORY_KEY).toBe('facet:v2:history');

interface StoredHistoryV2 {
  version: 2;
  results: FacetResult[];
}
```

Create one valid legacy fixture using the old rich shape (`primary`/`adjacent` with name, pattern, hook, strengths, pitfalls, relationship need, action; standout with `label`). Also create a transitional v1 fixture containing Task 1's already-neutral `primary`/`adjacent` references and label-free standout, because users may finish a quiz between Tasks 1 and 4. Assert both shapes normalize to the same v2 result contract; first `loadHistory(storage)` writes a v2 envelope, and a second call returns the same single ID. Add cases for malformed JSON, unknown archetype codes, invalid scores, duplicate IDs, more than three entries, and a failing `setItem` during migration.

For deletion, seed progress, v1 history, v2 history, locale, and `another-app`; assert only the four FACET keys disappear.

- [ ] **Step 2: Run storage tests and confirm the v1-only implementation fails**

```bash
pnpm exec vitest run tests/storage.test.ts
```

Expected: FAIL on missing v2 key/envelope, rich-copy normalization, and locale deletion.

- [ ] **Step 3: Implement strict v2 validation and one-way migration**

Use these public constants:

```ts
export const PROGRESS_KEY = 'facet:v1:progress';
export const LEGACY_HISTORY_KEY = 'facet:v1:history';
export const HISTORY_KEY = 'facet:v2:history';
```

Import `LOCALE_KEY` from `src/i18n/locale.ts` for scoped deletion; do not declare a second string constant.

Validate every score in 0–100, dates/IDs as non-empty strings, archetype codes against the 12-code set, non-negative finite distances, allowed clarity/weather/standout values, and `version === 2`. `loadHistory` behavior is exact:

1. If a valid v2 envelope exists, return its newest three distinct results.
2. If the v2 key exists but is malformed, return `[]` and do not trust v1 as a silent fallback.
3. If no v2 key exists, parse v1, accept either a valid old rich result or Task 1's valid transitional neutral result, normalize both to the same stable codes/numbers, deduplicate by ID keeping the first newest occurrence, slice to three, and attempt to write v2.
4. If migration writing fails, return the normalized in-memory results without throwing; a later load may retry.
5. Leave the v1 key in place as rollback insurance; all new appends target only v2.

- [ ] **Step 4: Make append and delete operations schema-aware**

`appendHistory` validates the neutral result, replaces a repeated ID, keeps newest-first order, limits to three, and writes `{ version: 2, results }`. `clearAllLocalData` removes exactly `PROGRESS_KEY`, `LEGACY_HISTORY_KEY`, `HISTORY_KEY`, and `LOCALE_KEY`, catches each error independently, and returns false if any removal failed.

After confirmed deletion, the controller redetects locale using browser languages, resets the app with that locale, and returns to history. Add direct Chinese and English deletion-scope/status strings to their catalogs in this task; Task 5 wires those catalog fields into the history dialog and announcement when the renderer becomes catalog-driven.

- [ ] **Step 5: Run storage and deletion journey tests**

```bash
pnpm exec vitest run tests/storage.test.ts tests/state.test.ts
pnpm exec playwright test --grep "clears FACET"
```

Expected: PASS; unrelated storage remains untouched and no duplicate history appears after migration.

- [ ] **Step 6: Commit the migration**

```bash
git add src/domain/storage.ts src/app/controller.ts tests/storage.test.ts e2e/app.spec.ts
git commit -m "feat: migrate history to locale-neutral v2 records"
```

### Task 5: Inject Catalogs into Every Screen and Apply the Approved Voice

**Files:**
- Modify: `src/app/controller.ts`
- Modify: `src/types.ts`
- Modify: `src/data/questions.ts`
- Modify: `src/data/archetypes.ts`
- Delete: `src/data/copy.ts`
- Modify: `src/domain/scoring.ts`
- Modify: `src/domain/result.ts`
- Modify: `src/app/screens/landing.ts`
- Modify: `src/app/screens/intro.ts`
- Modify: `src/app/screens/quiz.ts`
- Modify: `src/app/screens/result.ts`
- Modify: `src/app/screens/atlas.ts`
- Modify: `src/app/screens/history.ts`
- Modify: `src/app/screens/locale-switcher.ts`
- Modify: `src/styles/components.css`
- Modify: `index.html`
- Modify: `tests/state.test.ts`
- Modify: `tests/data.test.ts`
- Modify: `tests/result.test.ts`

**Interfaces:**
- Consumes: `LocaleCatalog`, Task 1's neutral metadata/result projections, `getArchetypeDefinition`, and `renderLocaleSwitcher`.
- Produces: six catalog-driven renderer signatures and same-route language changes without answer/result/history mutation.

- [ ] **Step 1: Replace Chinese-string markup tests with bilingual renderer contracts**

Write failing tests for these exact signatures:

```ts
renderLanding(copy: LocaleCatalog): string;
renderIntro(copy: LocaleCatalog): string;
renderQuiz(state: AppState, copy: LocaleCatalog): string;
renderResult(result: FacetResult, copy: LocaleCatalog, shareMessage?: string): string;
renderAtlas(copy: LocaleCatalog): string;
renderHistory(history: readonly FacetResult[], copy: LocaleCatalog): string;
```

For every renderer, call once with `CATALOGS['zh-CN']` and once with `CATALOGS.en`. Assert `data-screen`, action names, semantic landmarks, and domain codes are identical while visible headings differ. Assert all 12 archetypes render in each locale, eight meters remain, and no `undefined`, `[object Object]`, raw copy key, or Chinese UI text appears in English output. Select one answer in each locale and assert the visible selected-state label comes from `copy.quiz.selected`; the English markup must not contain `已选`. The Chinese question assertion must equal the current approved prompt exactly.

- [ ] **Step 2: Run screen tests and confirm hard-coded renderers fail**

```bash
pnpm exec vitest run tests/state.test.ts
```

Expected: FAIL because renderers accept no catalog and read Chinese-rich domain fields.

- [ ] **Step 3: Convert landing, intro, quiz, atlas, and history to explicit catalog injection**

Add `renderLocaleSwitcher(copy.meta.locale, copy)` to every main screen header, including chapter, empty, and error states. The renderer signatures in Step 1 intentionally receive a catalog rather than `AppState` except for quiz, so `copy.meta.locale` is the single consistent locale source. Look up questions by `copy.questions[question.id]`; look up archetype copy by stable code. Format dates with:

```ts
new Intl.DateTimeFormat(copy.meta.locale, {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(date);
```

Use localized accessible names for navigation, progress, fieldset legends, selected answers, dialogs, score outputs, and status regions. Keep `data-action`, `data-screen`, `data-dimension`, result IDs, question IDs, and archetype codes language-independent.

Remove the hard-coded `content: "已选"` pseudo-element from `src/styles/components.css`. Render the selected-state text as real escaped DOM content from `copy.quiz.selected` (preferred for assistive technology), or expose it through a localized `data-selected-label` consumed by `content: attr(data-selected-label)`. Browser tests in Task 7 must assert the visible English selected state contains no Chinese. The controller metadata update from Task 3 must also localize the static `index.html` skip link on every render.

After these consumers compile, make the final source-data cutover: rename the metadata projections back to the canonical `QUESTIONS` and `ARCHETYPES` exports, delete prompt/name/hook/strength/pitfall/relationship/action fields from them, delete `src/data/copy.ts`, and remove `getLegacyArchetypeCopy`. Update data/result tests to assert the canonical exports contain no display fields. Scoring continues to consume the canonical metadata-only arrays.

- [ ] **Step 4: Convert result rendering without restoring display copy to `FacetResult`**

Resolve `primary` and `adjacent` through:

```ts
const primaryDefinition = getArchetypeDefinition(result.primary.code);
const primaryCopy = copy.archetypes[result.primary.code];
const adjacentDefinition = getArchetypeDefinition(result.adjacent.code);
const adjacentCopy = copy.archetypes[result.adjacent.code];
```

Use definitions for pattern math and catalog copy for names/explanations. Derive the standout label at render time from `copy.dimensions[dimension].lowLabel/highLabel` or `copy.result.balancedStandout`. Build operating and adjacent explanations from locale-specific phrase fields in the catalog, so English punctuation/order is authored independently from Chinese rather than concatenated as a literal translation.

- [ ] **Step 5: Update the controller's render boundary**

Use:

```ts
function renderScreen(
  state: AppState,
  history: readonly FacetResult[],
  shareMessage: string,
  copy: LocaleCatalog,
): string;
```

At render time obtain `const copy = getCatalog(state.locale)`, pass it to the active screen, localize unreadable-progress and quiz-failure notices, and apply document metadata. Switching locale must not call `appendHistory`, clear progress, alter question order/index/answers, or generate a new result ID.

- [ ] **Step 6: Run all unit tests and build**

```bash
pnpm test
pnpm build
```

Expected: all unit tests PASS; compiled HTML contains both catalogs but no external runtime resource.

- [ ] **Step 7: Commit bilingual screens**

```bash
git add src/app/controller.ts src/app/screens src/styles/components.css index.html src/types.ts src/data/questions.ts src/data/archetypes.ts src/data/copy.ts src/domain/scoring.ts src/domain/result.ts tests/state.test.ts tests/data.test.ts tests/result.test.ts
git commit -m "feat: render every FACET screen in two languages"
```

### Task 6: Localize Controller Feedback and Canvas Share Cards

**Files:**
- Modify: `src/domain/share.ts`
- Modify: `src/app/controller.ts`
- Modify: `tests/share.test.ts`
- Modify: `tests/state.test.ts`

**Interfaces:**
- Consumes: `FacetResult`, `LocaleCatalog`, catalog archetype/weather/standout copy, and `ShareCanvasContext`.
- Produces: `drawShareCard(context, result, copy, scale?)`, locale-sensitive wrapping, bilingual status/error feedback, and unchanged local-only PNG download.

- [ ] **Step 1: Write failing Chinese/English Canvas tests**

Update the fake Canvas context to record `fillText`. Assert:

```ts
drawShareCard(context, result, CATALOGS['zh-CN']);
expect(drawnText).toContain('娱乐向自我观察');
expect(drawnText.join(' ')).toContain(CATALOGS['zh-CN'].archetypes[result.primary.code].name);

drawShareCard(context, result, CATALOGS.en);
expect(drawnText).toContain('For entertainment and self-reflection');
expect(drawnText.join(' ')).toContain(CATALOGS.en.archetypes[result.primary.code].name);
```

Add an English wrapping case with `Your operating notes — warranty not included, practical guidance included.` and assert it wraps at word boundaries without dropping punctuation. Retain scale validation and save/restore assertions.

- [ ] **Step 2: Run share tests and confirm the Chinese-only signature fails**

```bash
pnpm exec vitest run tests/share.test.ts
```

Expected: FAIL because `drawShareCard` accepts no catalog and uses character wrapping for every locale.

- [ ] **Step 3: Implement locale-aware wrapping and drawing**

Change the public signature to:

```ts
drawShareCard(
  context: ShareCanvasContext,
  result: FacetResult,
  copy: LocaleCatalog,
  scale?: number,
): void;
```

For `zh-CN`, wrap by Unicode code point as today. For `en`, tokenize into words plus following whitespace, measure candidate lines, and split an individual overlong token only as a last resort. Look up primary/adjacent names, weather, boundary, standout, free-facet title, footer facts, and disclaimer from `copy.share`/catalog records. Use the system sans stack for English headings and preserve the existing Songti stack for Chinese headings.

- [ ] **Step 4: Localize every download and error status**

Pass the current catalog into `drawShareCard`. Read success, unsupported Canvas, empty Blob, download failure, quiz result failure, storage deletion failure, and unreadable progress from `copy.feedback`. Preserve `FACET-${result.primary.code}.png` as the language-neutral filename and keep answer-level data off the card.

- [ ] **Step 5: Run focused and full unit suites**

```bash
pnpm exec vitest run tests/share.test.ts tests/state.test.ts
pnpm test
pnpm build
```

Expected: PASS with both locale card tests and no domain copy regression.

- [ ] **Step 6: Commit localized feedback and cards**

```bash
git add src/domain/share.ts src/app/controller.ts tests/share.test.ts tests/state.test.ts
git commit -m "feat: localize feedback and share cards"
```

### Task 7: Harden English Layout, Accessibility, and Bilingual Browser Journeys

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/base.css`
- Modify: `src/styles/components.css`
- Modify: `src/styles/screens.css`
- Modify: `src/styles/responsive.css`
- Modify: `playwright.config.ts`
- Create: `playwright.online.config.ts`
- Modify: `e2e/app.spec.ts`
- Create: `e2e/online.spec.ts`

**Interfaces:**
- Consumes: stable `data-*` hooks, localized accessible names, existing Chromium/mobile/reduced-motion projects, and `PLAYWRIGHT_BASE_URL` for remote smoke tests.
- Produces: responsive bilingual UI, complete local E2E coverage, and an online-only smoke suite for Task 10.

- [ ] **Step 1: Write failing E2E helpers for both locales**

Parameterize helpers with:

```ts
type JourneyLocale = 'zh-CN' | 'en';
const JOURNEY = {
  'zh-CN': { title: 'FACET｜人格切面', startHeading: '按你真实的运行方式，不按理想版本。' },
  en: { title: 'FACET | Personality Facets', startHeading: 'Answer for how you actually operate, not your idealized version.' },
} as const;
```

Add tests for:

- complete 32-question mobile journey in Chinese and English;
- switch at question 6 and retain index, prior selection, answers, order, and scroll context;
- switch on result and retain result ID, codes, scores, and one history row while changing visible names;
- 12 atlas entries in each language;
- valid PNG download in each language;
- refresh restores locale, progress, and answer;
- delete clears progress/v1/v2 history/locale but preserves unrelated storage;
- keyboard-only journey, visible focus, native dialog, and reduced motion;
- no external request and no console error;
- no horizontal overflow at 360, 390, 768, and 1280 using the longest English result/atlas content.

- [ ] **Step 2: Run the new local journeys and capture failures**

```bash
pnpm test:e2e
```

Expected: FAIL on untranslated selectors, English overflow, locale restoration, or undersized switch controls before CSS/flow fixes.

- [ ] **Step 3: Apply bounded CSS changes within the existing visual system**

Use `[lang="en"]` only where Latin copy needs different wrapping/measure; do not create a second theme. Enforce:

```css
.locale-switcher button { min-inline-size: 44px; min-block-size: 44px; }
[lang="en"] .landing-deck,
[lang="en"] .intro-copy,
[lang="en"] .result-section > p { max-inline-size: 72ch; }
.button, .text-action { overflow-wrap: anywhere; }
```

Preserve the 4/8/12/16/24/32/48/72 spacing scale, 4/12/999 radii, current color tokens, route motif, focus-visible outline, and reduced-motion rules. Fix actual browser defects with targeted rules only. Verify the switch active state remains distinguishable without color.

- [ ] **Step 4: Make Playwright support local and online modes**

Set `use.baseURL` from `process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173'`. Start Vite's local web server only when that environment variable is absent. Tag `e2e/online.spec.ts` with a title prefix `@online` and keep it out of the default local project via `testIgnore`. Create `playwright.online.config.ts` with one Chromium project, `testMatch: /online\.spec\.ts/`, the required `PLAYWRIGHT_BASE_URL`, and no `webServer`; Task 10 invokes that exact config.

The online smoke test must fail on `console.error`, `pageerror`, failed requests, or a request whose origin differs from the Pages origin; it opens the landing page, switches both ways, opens intro, starts the quiz, answers the first question, and checks the URL still belongs to `thworry.github.io/facet-personality/`.

- [ ] **Step 5: Run browser and visual quality gates**

```bash
pnpm test:e2e
pnpm test
pnpm build
```

Expected: all existing and new projects PASS. Inspect browser screenshots at 360, 390, 768, 1024, 1280, and 1440px for landing, intro, longest English question, chapter, free/dual result, atlas, history empty/populated, deletion dialog, and share success. At 200% zoom confirm no content/control overlap. Record any intentional screenshot expectation updates in the same commit.

- [ ] **Step 6: Commit responsive and E2E hardening**

```bash
git add src/styles playwright.config.ts playwright.online.config.ts e2e/app.spec.ts e2e/online.spec.ts
git commit -m "test: verify bilingual FACET browser journeys"
```

### Task 8: Package the Project for Open Source and Automated Pages Deployment

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Create: `README.zh-CN.md`
- Create: `LICENSE`
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `.github/workflows/deploy-pages.yml`
- Create: `scripts/capture-previews.mjs`
- Create: `docs/assets/preview-zh.png`
- Create: `docs/assets/preview-en.png`
- Create: `tests/release.test.ts`

**Interfaces:**
- Consumes: verified bilingual app, locked pnpm file, Playwright Chromium, target GitHub owner/repo/Pages URL, and existing single-file build.
- Produces: complete public-repository documentation, governance, preview assets, reproducible package metadata, and a least-privilege Pages workflow. This task creates files locally only; it does not contact GitHub.

- [ ] **Step 1: Write failing release-package tests**

In `tests/release.test.ts`, read repository files and assert:

```ts
expect(pkg.packageManager).toBe('pnpm@11.19.0');
expect(pkg.engines.node).toBe('>=24');
expect(readme).toContain('https://thworry.github.io/facet-personality/');
expect(readme).toContain('README.zh-CN.md');
expect(readmeZh).toContain('README.md');
expect(license).toContain('MIT License');
expect(license).toContain('Copyright (c) 2026 Thworry');
expect(workflow).toContain('pnpm install --frozen-lockfile');
expect(workflow).toContain('pnpm test:e2e');
expect(workflow).toContain('actions/deploy-pages@v4');
expect(workflow).not.toMatch(/personal access token|GH_PAT|secrets\.[A-Z_]*TOKEN/i);
```

Also assert both preview PNGs start with the PNG signature and have a non-trivial size greater than 10KB after capture.

- [ ] **Step 2: Run the release test and confirm missing files fail**

```bash
pnpm exec vitest run tests/release.test.ts
```

Expected: FAIL because bilingual docs, license, workflow, and previews do not yet exist.

- [ ] **Step 3: Lock runtime metadata and document exact local commands**

Add:

```json
{
  "packageManager": "pnpm@11.19.0",
  "engines": { "node": ">=24" }
}
```

Keep `private: true` to prevent accidental npm publication. README commands are exactly:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm test:e2e
pnpm build
```

- [ ] **Step 4: Write idiomatic English and Chinese README files**

`README.md` is the English default and starts with a `中文说明` link. `README.zh-CN.md` starts with an `English README` link. Both contain these sections in their own natural language: what FACET is, target live demo URL marked as pending first deployment, screenshots, 32 scenarios/8 dimensions/12 archetypes, local-first privacy, entertainment boundary, scoring transparency, development, tests, project structure, contribution, and MIT license.

The English opening is concise and native:

```text
FACET is a bilingual, local-first personality reflection quiz built from 32 everyday scenarios. It maps six core tendencies and two recent-state signals without pretending to diagnose you—or crown a rarest type.
```

The Chinese opening is independently phrased:

```text
FACET 是一个中英双语、本地优先的人格自我观察测试。它用 32 个日常场景拆出 6 条核心倾向和 2 个近期状态信号，不做诊断，也不举办“最稀有人格”颁奖礼。
```

Explain that changing languages changes presentation only and does not establish cross-cultural psychometric equivalence.

- [ ] **Step 5: Add license and contribution governance**

Use the canonical MIT License text with `Copyright (c) 2026 Thworry`. `CONTRIBUTING.md` contains separate English and Chinese sections with issue etiquette, branch/commit guidance, the five exact verification commands, copy rules, no diagnostic claims, local-only privacy, and pull-request checklist.

Use Contributor Covenant v2.1 text in `CODE_OF_CONDUCT.md`; set enforcement reporting to GitHub's private repository advisory form at `https://github.com/Thworry/facet-personality/security/advisories/new`, and include a short Chinese note pointing readers to the same confidential channel. Do not invent an email address.

- [ ] **Step 6: Create the least-privilege Pages workflow**

Use this structure exactly, retaining current major action versions:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.19.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test
      - run: pnpm test:e2e
      - run: pnpm build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 7: Capture real bilingual previews**

`scripts/capture-previews.mjs` reads `FACET_PREVIEW_URL` with fallback `http://127.0.0.1:4173`, uses Playwright Chromium at 1280×900, clears storage, forces `zh-CN`, completes the fixed answer sequence `[3, 4, 2, 5, 1]` cyclically through all 32 questions, and captures the rendered result to `docs/assets/preview-zh.png`. Repeat from clean storage with `en` for `docs/assets/preview-en.png`, and close the browser in `finally`. Screenshots must be real rendered application states, not manually drawn mockups. Start `pnpm exec vite preview --host 127.0.0.1 --port 4173`, run the script, then terminate that preview process cleanly.

- [ ] **Step 8: Run release, unit, E2E, and build gates**

```bash
pnpm exec vitest run tests/release.test.ts
pnpm test
pnpm test:e2e
pnpm build
```

Expected: PASS; both README links resolve locally, both PNGs are valid, and the workflow has no personal token reference.

- [ ] **Step 9: Commit the open-source package**

```bash
git add package.json pnpm-lock.yaml README.md README.zh-CN.md LICENSE CONTRIBUTING.md CODE_OF_CONDUCT.md .github/workflows/deploy-pages.yml scripts/capture-previews.mjs docs/assets tests/release.test.ts
git commit -m "docs: prepare FACET for public release"
```

### Task 9: Run Final Local Acceptance and Synchronize the Single-File Deliverable

**Files:**
- Modify: `package.json`
- Create: `e2e/file.spec.ts`
- Create: `playwright.file.config.ts`
- Modify: `QA-REPORT.md`
- Modify: `/Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html`
- Create: `artifacts/bilingual/` screenshots and machine-readable audit output as local QA evidence

**Interfaces:**
- Consumes: all green local code/docs, `dist/index.html`, file-mode Playwright coverage, and the existing checker audit conventions.
- Produces: a verified self-contained `file://` artifact, updated acceptance report, and clean repository ready for Task 10.

- [ ] **Step 1: Add and run a failing file-mode E2E before the final build**

Create `e2e/file.spec.ts`, `playwright.file.config.ts`, and package script `test:e2e:file`. The test computes the absolute `dist/index.html` URL, opens it with `page.goto(pathToFileURL(path).href)`, and asserts:

- Chinese landing renders with `html[lang="zh-CN"]` when locale is pre-seeded;
- English landing renders after switching and refresh preserves English;
- intro and first question work without HTTP;
- no console error, page error, failed request, or non-`file:` request occurs;
- all scripts and styles are inline and no `src`, `href`, CSS `url(...)`, or import points at a remote HTTP origin; local fragment links such as `href="#main-content"` remain allowed.

Run once before rebuilding:

```bash
pnpm test:e2e:file
```

Expected: FAIL if `dist/index.html` is stale or the file-mode config/script does not yet exist.

- [ ] **Step 2: Run the complete clean local gate**

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm test:e2e
pnpm build
pnpm test:e2e:file
```

Expected: PASS for unit, local HTTP E2E, build, and `file://` E2E; every command exits 0. Record exact unit/E2E counts instead of carrying forward the old 47/15 counts.

- [ ] **Step 3: Inspect the built HTML for self-containment and privacy**

Run:

```bash
test -s dist/index.html
rg -n 'https?://|<script[^>]+src=|<link[^>]+href=|@import|analytics|telemetry' dist/index.html
```

Expected: the file exists; matches are limited to intentional visible documentation text if any, with no executable external script, stylesheet, font, image, analytics, or network endpoint. Confirm the app records only progress, v1/v2 history, and locale FACET keys.

- [ ] **Step 4: Synchronize and byte-verify the user-facing output**

```bash
cp dist/index.html /Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html
shasum -a 256 dist/index.html /Users/jojo/Documents/Codex/2026-08-24/sb/outputs/FACET人格切面.html
```

Expected: both SHA-256 values are identical.

- [ ] **Step 5: Perform rendered acceptance with timestamped evidence**

Use a real browser to inspect the final file at 360, 390, 768, 1024, 1280, and 1440px. Cover Chinese/English landing, intro, longest question, chapter transition, normal/free/dual result, atlas, empty/populated history, deletion dialog, share success, keyboard focus, 200% zoom, and reduced motion. Store screenshots/audit JSON under the gitignored `artifacts/bilingual/` directory as local QA evidence; do not force-add it. Record its path, state matrix, relevant hashes, and findings in `QA-REPORT.md` so the committed repository retains an auditable summary without checking in transient Playwright evidence.

- [ ] **Step 6: Update the QA report with observed facts**

Record the execution timestamp in Asia/Shanghai, exact test counts, browser projects, viewport/state matrix, output hash, zero external requests, console status, known cross-language psychometric limitation, and severity summary. Completion requires zero blocker/high/medium issue.

- [ ] **Step 7: Commit only repository QA evidence and confirm clean status**

```bash
git add package.json pnpm-lock.yaml e2e/file.spec.ts playwright.file.config.ts QA-REPORT.md
git commit -m "test: accept bilingual single-file release"
git status --short
```

Expected: commit succeeds and `git status --short` is empty; `artifacts/bilingual/` remains ignored by the existing `.gitignore` and is not force-added. The synchronized file under `/outputs` remains the user-facing artifact outside this repository.

### Task 10: Create the Public GitHub Repository, Deploy Pages, and Verify the Live Product

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- No other local product files should change unless a failed online gate requires a separately reviewed fix commit.

**Interfaces:**
- Consumes: clean local `main`, authenticated GitHub CLI account `Thworry`, green local gates, `.github/workflows/deploy-pages.yml`, and `e2e/online.spec.ts`.
- Produces: public MIT repository, metadata/topics, workflow-based Pages deployment, verified live URL, and README links that state the demo is live.

- [ ] **Step 1: Reconfirm the exact remote target before mutation**

Run:

```bash
git status --short
git branch --show-current
gh auth status --hostname github.com
gh repo view Thworry/facet-personality
```

Expected: worktree clean, branch `main`, authenticated as `Thworry`, and the final command reports that the repository does not exist. If it exists, stop and inspect its owner/visibility/default branch instead of overwriting or deleting anything.

- [ ] **Step 2: Run the online gate once and confirm it cannot pass before deployment**

```bash
PLAYWRIGHT_BASE_URL=https://thworry.github.io/facet-personality/ pnpm exec playwright test e2e/online.spec.ts --config playwright.online.config.ts
```

Expected: FAIL with an unavailable/404 target, proving the online acceptance test is exercising the real Pages URL rather than a local server. If it unexpectedly passes, stop and inspect the existing site before publishing.

- [ ] **Step 3: Create and push the approved public repository**

```bash
gh repo create Thworry/facet-personality \
  --public \
  --source=. \
  --remote=origin \
  --push \
  --description "A bilingual, local-first personality reflection quiz with 32 everyday scenarios."
```

Expected: `origin` points to `https://github.com/Thworry/facet-personality.git`, all local history is on `main`, and the repository is public. Do not squash or rewrite history.

- [ ] **Step 4: Set repository metadata, topics, Pages mode, and private reporting**

```bash
gh repo edit Thworry/facet-personality \
  --description "A bilingual, local-first personality reflection quiz with 32 everyday scenarios." \
  --homepage "https://thworry.github.io/facet-personality/" \
  --add-topic personality-quiz \
  --add-topic bilingual \
  --add-topic typescript \
  --add-topic vite \
  --add-topic local-first \
  --add-topic accessibility \
  --add-topic github-pages

gh api --method PUT repos/Thworry/facet-personality/private-vulnerability-reporting
```

Query `gh api repos/Thworry/facet-personality/pages`. If it returns 404, create workflow Pages with:

```bash
gh api --method POST repos/Thworry/facet-personality/pages -f build_type=workflow
```

If it already exists with another build type, update it with:

```bash
gh api --method PUT repos/Thworry/facet-personality/pages -f build_type=workflow
```

- [ ] **Step 5: Wait for the first workflow and inspect failures rather than bypassing gates**

Run:

```bash
gh run list --repo Thworry/facet-personality --workflow deploy-pages.yml --limit 1
FACET_RUN_ID="$(gh run list --repo Thworry/facet-personality --workflow deploy-pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
gh run watch "$FACET_RUN_ID" --repo Thworry/facet-personality --exit-status
```

Expected: build/test/E2E/deploy jobs conclude `success`. On failure, inspect with `gh run view "$FACET_RUN_ID" --repo Thworry/facet-personality --log-failed`, make the smallest reviewed fix, rerun local gates, commit, and push; never disable tests to obtain a green deployment.

- [ ] **Step 6: Verify HTTP, repository settings, and live browser behavior**

Run:

```bash
curl --fail --silent --show-error --location --output /dev/null --write-out '%{http_code}\n' https://thworry.github.io/facet-personality/
PLAYWRIGHT_BASE_URL=https://thworry.github.io/facet-personality/ pnpm exec playwright test e2e/online.spec.ts --config playwright.online.config.ts
gh repo view Thworry/facet-personality --json nameWithOwner,isPrivate,licenseInfo,homepageUrl,url
```

Expected: HTTP 200; online test PASS with zero console errors, failed requests, and third-party requests; repository reports `isPrivate: false`, MIT license, correct homepage, and correct URL.

- [ ] **Step 7: Mark the verified demo live in both README files**

Replace the pre-deployment wording with direct links:

```markdown
**Live demo:** [thworry.github.io/facet-personality](https://thworry.github.io/facet-personality/)
```

```markdown
**在线体验：** [thworry.github.io/facet-personality](https://thworry.github.io/facet-personality/)
```

Then commit and push:

```bash
git add README.md README.zh-CN.md
git commit -m "docs: confirm live FACET demo"
git push origin main
```

- [ ] **Step 8: Wait for the final README-triggered deployment and repeat smoke checks**

Run:

```bash
FACET_FINAL_RUN_ID="$(gh run list --repo Thworry/facet-personality --workflow deploy-pages.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
gh run watch "$FACET_FINAL_RUN_ID" --repo Thworry/facet-personality --exit-status
curl --fail --silent --show-error --location --output /dev/null --write-out '%{http_code}\n' https://thworry.github.io/facet-personality/
PLAYWRIGHT_BASE_URL=https://thworry.github.io/facet-personality/ pnpm exec playwright test e2e/online.spec.ts --config playwright.online.config.ts
```

Expected: final deployment `success`, HTTP 200, and online smoke PASS. Open the repository URL and Pages URL in a real browser and verify README language links, About homepage, Chinese/English switching, intro, and first answer. Report the final repository URL, Pages URL, commit hash, Actions run URL, local output path, test counts, and Asia/Shanghai completion time.

## Final Verification Matrix

| Requirement | Primary task | Final evidence |
|---|---:|---|
| Complete catalogs and matching keys | 2 | `tests/i18n.test.ts` |
| Language-neutral questions/archetypes/results | 1, 5 | data/result tests and renderer lookup |
| Locale detection, state, switch, metadata | 3 | locale/state tests and E2E |
| All screens and natural bilingual voice | 2, 5 | bilingual renderer tests and screenshots |
| v1→v2 migration and scoped deletion | 4 | storage tests and deletion E2E |
| Bilingual Canvas card | 6 | share tests and dual PNG downloads |
| Responsive/accessibility/reduced motion | 7 | Playwright viewport/project matrix |
| Self-contained `file://` output | 9 | file-mode E2E and matching SHA-256 |
| Open-source docs and workflow | 8 | release tests and local workflow review |
| Public repository and verified Pages | 10 | GitHub metadata, green Actions, HTTP 200, online E2E |
