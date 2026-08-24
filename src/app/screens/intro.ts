const RESPONSE_LABELS = ['完全不像我', '不太像我', '一半一半', '比较像我', '非常像我'] as const;

export function renderIntro(): string {
  return `
    <div class="screen screen--intro" data-screen="intro">
      <header class="screen-header">
        <button class="text-action" type="button" data-action="back">← 返回</button>
        <span class="screen-code">FCT / READ FIRST</span>
      </header>

      <section class="intro-copy" aria-labelledby="screen-title">
        <p class="eyebrow">作答前说明</p>
        <h1 id="screen-title" tabindex="-1">按你真实的运行方式，不按理想版本。</h1>
        <p>没有正确答案。犹豫时，选择更常发生的那个。</p>
      </section>

      <section class="timeframes" aria-label="两个作答时间范围">
        <article>
          <p class="section-number">01 / CORE</p>
          <h2>前 24 题：大多数情况下</h2>
          <p>想想日常里的你，而不是今天刚好发生的一件事。</p>
        </article>
        <article>
          <p class="section-number">02 / WEATHER</p>
          <h2>最后 8 题：最近两周</h2>
          <p>只看近期的负荷和恢复；它不会重新定义你的核心原型。</p>
        </article>
      </section>

      <section class="response-preview" aria-labelledby="response-title">
        <h2 id="response-title">五级作答刻度</h2>
        <ol>
          ${RESPONSE_LABELS.map((label, index) => `<li><span>${index + 1}</span>${label}</li>`).join('')}
        </ol>
        <p>桌面端可直接按数字键 1–5；Enter 前进，← 返回上一题。</p>
      </section>

      <section class="consent-note">
        <p>开始即表示你理解：这是娱乐向、情境化自我观察工具，不是心理测评或诊断。</p>
        <button class="button button--primary" type="button" data-action="begin-quiz">我明白，开始测试</button>
      </section>
    </div>
  `;
}
