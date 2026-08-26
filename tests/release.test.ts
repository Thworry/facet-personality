import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function repoPath(relativePath: string): string {
  return fileURLToPath(new URL(relativePath, new URL('../', import.meta.url)));
}

function readText(relativePath: string): string {
  const path = repoPath(relativePath);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function readBytes(relativePath: string): Uint8Array {
  const path = repoPath(relativePath);
  return existsSync(path) ? readFileSync(path) : new Uint8Array();
}

describe('public release package', () => {
  it('locks the approved package manager and Node runtime', () => {
    const pkg = JSON.parse(readText('package.json')) as {
      private?: boolean;
      packageManager?: string;
      engines?: { node?: string };
    };

    expect(pkg.private).toBe(true);
    expect(pkg.packageManager).toBe('pnpm@11.19.0');
    expect(pkg.engines?.node).toBe('>=24');
  });

  it('ships reciprocal, idiomatic bilingual project entry points', () => {
    const readme = readText('README.md');
    const readmeZh = readText('README.zh-CN.md');

    expect(readme).toContain('README.zh-CN.md');
    expect(readmeZh).toContain('README.md');
    expect(readme).toContain('https://thworry.github.io/facet-personality/');
    expect(readmeZh).toContain('https://thworry.github.io/facet-personality/');
    expect(readme).toContain('32 everyday scenarios');
    expect(readmeZh).toContain('32 个日常场景');
    expect(readme).toMatch(/local-first/i);
    expect(readmeZh).toContain('本地优先');
    expect(existsSync(repoPath('README.zh-CN.md'))).toBe(true);
  });

  it('includes the approved license and contribution governance', () => {
    const license = readText('LICENSE');
    const contributing = readText('CONTRIBUTING.md');
    const codeOfConduct = readText('CODE_OF_CONDUCT.md');

    expect(license).toContain('MIT License');
    expect(license).toContain('Copyright (c) 2026 Thworry');
    expect(contributing).toContain('pnpm install --frozen-lockfile');
    expect(contributing).toContain('pnpm test:e2e');
    expect(codeOfConduct).toContain('Contributor Covenant');
    expect(codeOfConduct).toContain(
      'https://github.com/Thworry/facet-personality/security/advisories/new',
    );
  });

  it('uses a least-privilege, locked Pages workflow', () => {
    const workflow = readText('.github/workflows/deploy-pages.yml');

    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('pnpm install --frozen-lockfile');
    expect(workflow).toContain('pnpm test:e2e');
    expect(workflow).toContain('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1');
    expect(workflow).toContain('pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86');
    expect(workflow).toContain('actions/setup-node@820762786026740c76f36085b0efc47a31fe5020');
    expect(workflow).toContain('actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d');
    expect(workflow).toContain('actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9');
    expect(workflow).toContain('actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128');
    expect(workflow).not.toMatch(/personal access token|GH_PAT|secrets\.[A-Z_]*TOKEN/i);
  });

  it('gates pull requests and Pages deployment behind the complete CI suite', () => {
    const pkg = JSON.parse(readText('package.json')) as {
      scripts?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const eslintConfig = readText('eslint.config.js');
    const workspace = readText('pnpm-workspace.yaml');
    const workflow = readText('.github/workflows/deploy-pages.yml');

    expect(pkg.scripts?.lint).toBe('eslint .');
    expect(pkg.scripts?.typecheck).toBe('tsc --noEmit');
    expect(pkg.devDependencies?.eslint).toBe('10.8.1');
    expect(pkg.devDependencies?.['typescript-eslint']).toBe('8.67.0');
    expect(workspace).toContain("'@typescript-eslint/tsconfig-utils': 8.67.0");
    expect(workspace).toContain("'@typescript-eslint/types': 8.67.0");
    expect(workspace).not.toContain('minimumReleaseAgeExclude');
    expect(eslintConfig).toContain('globals.browser');
    expect(eslintConfig).toContain('globals.node');
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

  it('contains real, non-trivial bilingual PNG previews', () => {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    for (const relativePath of ['docs/assets/preview-zh.png', 'docs/assets/preview-en.png']) {
      const preview = readBytes(relativePath);
      expect(preview.byteLength, relativePath).toBeGreaterThan(10_000);
      expect([...preview.slice(0, pngSignature.length)], relativePath).toEqual(pngSignature);
    }
  });
});
