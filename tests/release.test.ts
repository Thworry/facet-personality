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
    expect(workflow).toContain('actions/deploy-pages@v4');
    expect(workflow).not.toMatch(/personal access token|GH_PAT|secrets\.[A-Z_]*TOKEN/i);
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
