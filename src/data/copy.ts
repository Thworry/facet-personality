import type { CoreDimension, DimensionCode, StateDimension, WeatherCode } from '../types';

export const CORE_DIMENSIONS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'] as const satisfies readonly CoreDimension[];
export const STATE_DIMENSIONS = ['W1', 'W2'] as const satisfies readonly StateDimension[];
export const DIMENSIONS = [...CORE_DIMENSIONS, ...STATE_DIMENSIONS] as const satisfies readonly DimensionCode[];

interface DimensionCopy {
  name: string;
  lowLabel: string;
  highLabel: string;
  lowDescription: string;
  highDescription: string;
}

export const DIMENSION_COPY = {
  F1: {
    name: '内在坐标',
    lowLabel: '回声校准',
    highLabel: '内置罗盘',
    lowDescription: '更常通过外界反馈确认自己的位置',
    highDescription: '更常依据内部价值判断自己的位置',
  },
  F2: {
    name: '启动节奏',
    lowLabel: '压力点火',
    highLabel: '提前启航',
    lowDescription: '更常由期限、压力或回应触发行动',
    highDescription: '更常在压力到来前主动启动',
  },
  F3: {
    name: '控制偏好',
    lowLabel: '现场改线',
    highLabel: '路线先行',
    lowDescription: '更习惯即兴适应、边走边改',
    highDescription: '更习惯先建路线、组织推进',
  },
  F4: {
    name: '社交充电',
    lowLabel: '静区回充',
    highLabel: '联机回充',
    lowDescription: '更常通过独处恢复、慢热开场',
    highDescription: '更常通过互动恢复、主动开场',
  },
  F5: {
    name: '边界强度',
    lowLabel: '关系融合',
    highLabel: '边界分区',
    lowDescription: '更容易融合需求、优先照顾关系',
    highDescription: '更容易区分责任、优先说明边界',
  },
  F6: {
    name: '表达策略',
    lowLabel: '分层传输',
    highLabel: '明线传输',
    lowDescription: '更常看场合、留白并分层表达',
    highDescription: '更常直接说明、及时摊开差异',
  },
  W1: {
    name: '负荷水平',
    lowLabel: '尚有余量',
    highLabel: '接近饱和',
    lowDescription: '最近仍有一些不被待办追赶的空间',
    highDescription: '最近注意力和待办更接近饱和',
  },
  W2: {
    name: '恢复弹性',
    lowLabel: '恢复偏慢',
    highLabel: '恢复可用',
    lowDescription: '最近情绪与疲劳更容易停留',
    highDescription: '最近较容易找到恢复节奏',
  },
} as const satisfies Record<DimensionCode, DimensionCopy>;

interface WeatherCopy {
  name: string;
  explanation: string;
}

export const WEATHER_COPY = {
  CLEAR: { name: '晴航', explanation: '余量尚可，也能找到恢复方式。' },
  MIST: { name: '慢雾', explanation: '压力不一定很高，但恢复按钮不太灵。' },
  TURBO: { name: '超频', explanation: '事情很多，但目前仍能回到节奏。' },
  STORM: { name: '雷雨', explanation: '负荷偏高，而且不容易真正恢复。' },
} as const satisfies Record<WeatherCode, WeatherCopy>;

export const BALANCED_STANDOUT = {
  dimension: 'BALANCED',
  direction: 'balanced',
  label: '均衡调频：六条线路都保留了换挡空间',
} as const;

