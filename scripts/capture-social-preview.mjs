import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const PREVIEW_PATH = fileURLToPath(
  new URL('../docs/assets/preview-en.png', import.meta.url),
);
const OUTPUT_PATH = fileURLToPath(
  new URL('../docs/assets/social-preview.png', import.meta.url),
);
const VIEWPORT = { width: 1280, height: 640 };

const preview = await readFile(PREVIEW_PATH);
const previewDataUrl = `data:image/png;base64,${preview.toString('base64')}`;
await mkdir(fileURLToPath(new URL('../docs/assets/', import.meta.url)), { recursive: true });

const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport: VIEWPORT,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  });

  await page.setContent(
    `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          html, body { width: 1280px; height: 640px; margin: 0; overflow: hidden; }
          body {
            background: #20221f;
            color: #f8f5ef;
            font-family: Arial, Helvetica, sans-serif;
          }
          main {
            position: relative;
            isolation: isolate;
            width: 1280px;
            height: 640px;
            overflow: hidden;
            border: 12px solid #c9f66f;
          }
          main::before {
            content: "";
            position: absolute;
            z-index: 5;
            top: -12px;
            left: 0;
            width: 246px;
            height: 12px;
            background: #f4553d;
          }
          .copy {
            position: relative;
            z-index: 4;
            width: 720px;
            height: 100%;
            padding: 50px 44px 42px 54px;
          }
          .eyebrow {
            margin: 0 0 26px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: .13em;
          }
          h1 {
            margin: 0;
            color: #fbf8f1;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 128px;
            font-weight: 700;
            line-height: .78;
            letter-spacing: -.07em;
          }
          .subtitle {
            margin: 25px 0 0 7px;
            color: #f4553d;
            font-size: 25px;
            font-weight: 800;
            letter-spacing: .11em;
          }
          .tag {
            display: inline-block;
            margin: 34px 0 0 5px;
            padding: 10px 14px 9px;
            border: 2px solid #171716;
            background: #c9f66f;
            color: #171716;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 17px;
            font-weight: 800;
            letter-spacing: .08em;
          }
          .numbers {
            margin: 38px 0 0 5px;
            max-width: 560px;
            border-top: 1px solid rgba(248, 245, 239, .38);
            padding-top: 20px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 17px;
            font-weight: 700;
            letter-spacing: .04em;
          }
          .boundary {
            position: absolute;
            left: 59px;
            bottom: 40px;
            border-left: 7px solid #f4553d;
            padding: 4px 0 4px 12px;
            color: #fbf8f1;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: .14em;
          }
          .result-frame {
            position: absolute;
            z-index: 1;
            top: 52px;
            left: 735px;
            width: 620px;
            height: 536px;
            overflow: hidden;
            border: 2px solid rgba(248, 245, 239, .72);
            background: #171716;
            box-shadow: -28px 30px 0 #171716;
          }
          .result-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: 14% top;
            filter: contrast(1.03) saturate(1.03);
          }
          .fade {
            position: absolute;
            z-index: 3;
            top: 0;
            left: 650px;
            width: 235px;
            height: 100%;
            background: linear-gradient(90deg, #20221f 18%, rgba(32, 34, 31, .84) 48%, rgba(32, 34, 31, 0));
            pointer-events: none;
          }
          .slash {
            position: absolute;
            z-index: 6;
            right: 31px;
            bottom: 27px;
            width: 178px;
            height: 11px;
            background: #f4553d;
            transform: rotate(-7deg);
            transform-origin: right center;
          }
        </style>
      </head>
      <body>
        <main aria-label="FACET social preview">
          <section class="copy">
            <p class="eyebrow">FACET / PERSONALITY FACETS</p>
            <h1>FACET</h1>
            <p class="subtitle">PERSONALITY, WITH EDGES.</p>
            <p class="tag">BILINGUAL · LOCAL-FIRST</p>
            <p class="numbers">32 SCENES / 6 CORE LINES / 2 RECENT SIGNALS</p>
            <p class="boundary">REFLECTION, NOT DIAGNOSIS</p>
          </section>
          <figure class="result-frame">
            <img src="${previewDataUrl}" alt="Real FACET English result screen">
          </figure>
          <div class="fade" aria-hidden="true"></div>
          <div class="slash" aria-hidden="true"></div>
        </main>
      </body>
    </html>`,
    { waitUntil: 'load' },
  );

  await page.locator('.result-frame img').evaluate((image) => image.decode());
  await page.screenshot({
    path: OUTPUT_PATH,
    animations: 'disabled',
    fullPage: false,
    type: 'png',
  });
} finally {
  await browser.close();
}
