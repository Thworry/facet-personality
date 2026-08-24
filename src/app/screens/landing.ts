export function renderLanding(): string {
  const stations = Array.from({ length: 32 }, (_, index) => {
    const interval = index % 4 === 0 ? ' landing-station--interval' : '';
    return `<span class="landing-station${interval}"><span>${index + 1}</span></span>`;
  }).join('');

  return `
    <div class="screen screen--landing" data-screen="landing">
      <header class="site-header">
        <a class="brand" href="#main-content" aria-label="FACET 人格切面首页">FACET / 人格切面</a>
        <nav aria-label="辅助导航">
          <button class="text-action" type="button" data-action="show-history">本地历史</button>
        </nav>
      </header>

      <section class="landing-hero" aria-labelledby="screen-title">
        <p class="eyebrow">32 个生活场景 · 8 条可解释线路</p>
        <h1 id="screen-title" tabindex="-1"><span>你不是一个类型。</span><span>你只是习惯用</span><span>某种方式运行。</span></h1>
        <p class="landing-deck">32 个生活场景，拆出 6 条稳定轨道和 2 个近期信号。没有“最好的人格”，也不拿一个百分比冒充心理学准确率。</p>
        <div class="landing-actions">
          <button class="button button--primary" type="button" data-action="start">开始读取我的切面</button>
          <button class="button button--secondary" type="button" data-action="show-atlas">先看十二种原型</button>
        </div>
      </section>

      <div class="landing-line" aria-hidden="true" data-stations="32">${stations}</div>

      <section class="facts" aria-label="测试信息">
        <div><strong>32题</strong><span>生活场景，不考标准答案</span></div>
        <div><strong>约6分钟</strong><span>可以返回修改，也可以刷新恢复</span></div>
        <div><strong>本地计算</strong><span>不上传逐题答案，不要求账号</span></div>
      </section>

      <aside class="boundary-note" aria-label="使用边界">
        <strong>娱乐向自我观察</strong>
        <p>结果适合用来开启对话，不用于心理诊断、招聘筛选、职业决策或关系判决。</p>
      </aside>
    </div>
  `;
}
