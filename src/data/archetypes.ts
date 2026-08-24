import type { Archetype, ArchetypeDefinition } from '../types';

export const ARCHETYPES = [
  {
    code: 'BUFFER',
    name: '缓冲器',
    pattern: ['M', 'L', 'L', 'L', 'H', 'M'],
    hook: '先让世界在门外等两秒，你需要把信号解压后再回应。',
    strengths: ['能把复杂信号拆开再判断', '不容易被群体情绪带跑', '能守住自己的时间和责任边界'],
    pitfalls: ['启动前的准备容易越积越多', '沉默时可能被误读为冷淡', '独自处理太久会错过同步时机'],
    relationshipNeed: '需要被允许先消化再回应，也需要对方把真正的截止时间说清楚。',
    action: '这一周遇到需要回复的事，先发一句“我收到了，今晚前给你答复”。',
  },
  {
    code: 'BOOST',
    name: '助推器',
    pattern: ['L', 'H', 'M', 'M', 'L', 'M'],
    hook: '你常在回应别人和共同目标时，突然获得推进力。',
    strengths: ['能迅速接住团队的下一步', '共同目标会激活行动力', '愿意补上协作中的空位'],
    pitfalls: ['容易把别人的优先级当成自己的', '独立目标缺少回应时动力下降', '答应太快后才发现负担过量'],
    relationshipNeed: '需要清晰的共同目标，同时也需要别人尊重你重新核对承诺的权利。',
    action: '本周答应新任务前，先问自己一句“如果没人期待，我还会选它吗”。',
  },
  {
    code: 'NEST',
    name: '安全舱',
    pattern: ['M', 'L', 'H', 'M', 'L', 'M'],
    hook: '你把秩序做成一个可以停靠的地方，熟悉感是燃料。',
    strengths: ['能把日常安排得稳定可依靠', '会照顾关系里的具体细节', '有路线时能持续推进'],
    pitfalls: ['变化太突然时启动较慢', '照料别人时容易挤掉自己', '为了稳妥可能延后必要的试错'],
    relationshipNeed: '需要提前量、可靠回应，以及双方都能使用的稳定节奏。',
    action: '挑一件犹豫中的小事，为它设一个十分钟、可随时停止的试运行。',
  },
  {
    code: 'ARCHIVE',
    name: '档案馆',
    pattern: ['H', 'M', 'H', 'L', 'L', 'L'],
    hook: '你内心有一套稳定索引，很多事不说，不代表没存档。',
    strengths: ['能长期保存细节与上下文', '独处时判断依然稳定', '擅长为复杂事情建立结构'],
    pitfalls: ['需要表达的内容也可能被封存', '旧经验有时会占据过多索引', '关系里容易让对方猜测真实感受'],
    relationshipNeed: '需要不被逼问的表达空间，也需要约定一个不会无限延期的沟通时间。',
    action: '本周选一件已在心里存档的事，用三句话告诉相关的人：事实、感受、希望。',
  },
  {
    code: 'SIGNAL',
    name: '信号塔',
    pattern: ['L', 'L', 'L', 'H', 'H', 'H'],
    hook: '你通过发出明确信号确认位置，交流时比做任务更快开机。',
    strengths: ['愿意主动打破陌生场合的沉默', '能把立场及时说明白', '在互动中保持清楚边界'],
    pitfalls: ['即兴表达可能快于实际推进', '外界反应会放大自我怀疑', '发出信号后可能低估收尾成本'],
    relationshipNeed: '需要直接、及时的回应，不希望重要分歧靠猜。',
    action: '本周每次提出一个想法时，同时补上一条你愿意亲自完成的下一步。',
  },
  {
    code: 'PATCH',
    name: '补丁匠',
    pattern: ['M', 'M', 'L', 'M', 'M', 'H'],
    hook: '不迷信完美方案，先把眼前故障修到能继续走。',
    strengths: ['能快速找到可用的临时解法', '面对变化不容易僵住', '发现问题时愿意及时说清'],
    pitfalls: ['临时修补可能累积成长期债务', '能运行后就容易忘记复盘', '直接指出故障时可能忽略对方节奏'],
    relationshipNeed: '需要允许先解决当下，也需要一起约定何时回来做彻底修复。',
    action: '把本周最常出现的一块“补丁”记下来，安排二十分钟找它的重复源头。',
  },
  {
    code: 'TOWER',
    name: '观察塔',
    pattern: ['H', 'L', 'M', 'L', 'M', 'H'],
    hook: '你偏爱从安静高处看清局势，然后一句话指出坐标。',
    strengths: ['能在噪声外保持独立判断', '擅长发现局势中的关键坐标', '开口时通常信息密度很高'],
    pitfalls: ['观察过久会错过参与窗口', '别人可能不知道你何时准备好', '清晰判断有时缺少过程同步'],
    relationshipNeed: '需要安静观察的余地，也希望交流可以直达重点。',
    action: '本周在一个还没完全想清的场合，提前分享一条“当前判断”，并标注它可以更新。',
  },
  {
    code: 'SCOUT',
    name: '先遣艇',
    pattern: ['H', 'H', 'L', 'L', 'M', 'M'],
    hook: '方向一旦确定，你会独自先走出去，路上再修地图。',
    strengths: ['内在方向明确时启动很快', '敢用小步试出真实路线', '在不确定中仍能保持行动'],
    pitfalls: ['可能忘记同步同伴与风险', '独自推进后才发现接口不一致', '速度快时容易略过恢复信号'],
    relationshipNeed: '需要行动自主权，也需要同伴用明确节点而非持续盯守来保持同步。',
    action: '本周启动一件新事前，先向相关的人发一条含“方向、风险、下次同步时间”的简报。',
  },
  {
    code: 'RADAR',
    name: '雷达站',
    pattern: ['L', 'H', 'M', 'H', 'H', 'L'],
    hook: '你擅长读取场域，但会为自己保留一道防火墙。',
    strengths: ['能快速读取人群的情绪变化', '在互动中推动事情向前', '面对强烈情绪仍能划清责任'],
    pitfalls: ['太关注环境会模糊自身坐标', '分层表达可能让需求不够清楚', '持续扫描场域会消耗注意力'],
    relationshipNeed: '需要被尊重边界，也需要有人主动问你本人想要什么，而不只依赖你的场面判断。',
    action: '每天一次，在回应别人之前先写下自己此刻最真实的一项需要。',
  },
  {
    code: 'PRISM',
    name: '棱镜',
    pattern: ['M', 'M', 'H', 'M', 'H', 'L'],
    hook: '你不是变来变去，而是知道同一道光该怎样折射。',
    strengths: ['能按场景调节表达颗粒度', '会用结构保持复杂沟通有序', '既看关系也能守住边界'],
    pitfalls: ['别人可能难以确认你的真实立场', '过度调节会增加内部负担', '准备合适说法时可能延迟关键沟通'],
    relationshipNeed: '需要别人理解你的分寸不是敷衍，同时允许你明确标注“不变的核心立场”。',
    action: '本周一次重要沟通里，先说出那句不随对象改变的核心立场，再调整表达方式。',
  },
  {
    code: 'ROUTER',
    name: '路由器',
    pattern: ['H', 'H', 'M', 'H', 'L', 'L'],
    hook: '你有自己的主线，也擅长把人和信息接到同一张网里。',
    strengths: ['能主动连接分散的人与信息', '有自己的判断主线', '懂得根据对象调整信息带宽'],
    pitfalls: ['连接过多会让边界拥堵', '容易接下隐形协调工作', '忙于转发信息时会延后自身任务'],
    relationshipNeed: '需要被看见的不只是连接能力，也包括你有权拒绝继续中转。',
    action: '本周从一条长期由你中转的信息链中退出一次，改为让两端直接对接。',
  },
  {
    code: 'BRIDGE',
    name: '接驳桥',
    pattern: ['L', 'M', 'H', 'H', 'M', 'H'],
    hook: '你把混乱的人群拉成一条可以通过的路线。',
    strengths: ['能把多人需求整理成共同路线', '愿意主动开场并澄清分歧', '组织复杂协作时可靠清楚'],
    pitfalls: ['长期承担不被看见的协调成本', '群体反馈容易影响自我判断', '为了让所有人通过而压缩自己'],
    relationshipNeed: '需要协调工作被明确分担，也需要他人直接确认你的个人选择。',
    action: '下一次多人协作前，先写明你负责的一段、别人负责的一段，以及停止加码的边界。',
  },
] as const satisfies readonly Archetype[];

function freezePattern(
  pattern: ArchetypeDefinition['pattern'],
): ArchetypeDefinition['pattern'] {
  return Object.freeze([...pattern]) as unknown as ArchetypeDefinition['pattern'];
}

export const ARCHETYPE_DEFINITIONS: readonly ArchetypeDefinition[] = Object.freeze(
  ARCHETYPES.map(({ code, pattern }) => Object.freeze({
    code,
    pattern: freezePattern(pattern),
  })),
);

export function getArchetypeDefinition(code: string): ArchetypeDefinition {
  const definition = ARCHETYPE_DEFINITIONS.find((archetype) => archetype.code === code);
  if (definition === undefined) {
    throw new Error(`Unknown archetype code: ${code}`);
  }
  return definition;
}
