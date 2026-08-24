import type {
  ArchetypeCode,
  Clarity,
  DimensionCode,
  WeatherCode,
} from '../types';

export type Locale = 'zh-CN' | 'en';

export interface MetaCopy<L extends Locale = Locale> {
  readonly locale: L;
  readonly title: string;
  readonly description: string;
}

export interface LocaleSwitcherCopy {
  readonly label: string;
  readonly chinese: string;
  readonly english: string;
  readonly currentLanguage: string;
  readonly changedTo: string;
}

export interface CommonCopy {
  readonly skipToMain: string;
  readonly back: string;
  readonly returnHome: string;
  readonly brandLabel: string;
}

export interface LandingFactCopy {
  readonly value: string;
  readonly detail: string;
}

export interface LandingCopy {
  readonly brandAriaLabel: string;
  readonly navigationLabel: string;
  readonly history: string;
  readonly eyebrow: string;
  readonly titleLines: readonly [string, string, string];
  readonly deckLead: string;
  readonly deckBody: string;
  readonly start: string;
  readonly atlas: string;
  readonly factsLabel: string;
  readonly facts: readonly [LandingFactCopy, LandingFactCopy, LandingFactCopy];
  readonly boundaryLabel: string;
  readonly boundaryTitle: string;
  readonly boundaryBody: string;
}

export interface IntroTimeframeCopy {
  readonly code: string;
  readonly title: string;
  readonly body: string;
}

export interface IntroCopy {
  readonly screenCode: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly realityCheck: string;
  readonly guidance: string;
  readonly timeframesLabel: string;
  readonly core: IntroTimeframeCopy;
  readonly recent: IntroTimeframeCopy;
  readonly scaleTitle: string;
  readonly keyboardHint: string;
  readonly consent: string;
  readonly begin: string;
}

export interface QuizCopy {
  readonly answerLabels: readonly [string, string, string, string, string];
  readonly progressTemplate: string;
  readonly progressAriaTemplate: string;
  readonly questionNumberTemplate: string;
  readonly usualTimeframe: string;
  readonly recentTimeframe: string;
  readonly legend: string;
  readonly selected: string;
  readonly navigationLabel: string;
  readonly previous: string;
  readonly next: string;
  readonly viewResult: string;
  readonly keyboardHint: string;
  readonly errorTitle: string;
  readonly errorBody: string;
  readonly reset: string;
}

export interface ChapterCopy {
  readonly screenCode: string;
  readonly eyebrow: string;
  readonly titleLines: readonly [string, string, string];
  readonly titleAriaLabel: string;
  readonly lead: string;
  readonly body: string;
  readonly continue: string;
  readonly back: string;
  readonly liveAnnouncement: string;
}

export interface AtlasCopy {
  readonly screenCode: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly lead: string;
  readonly strengths: string;
  readonly pitfalls: string;
  readonly return: string;
}

export interface HistoryCopy {
  readonly screenCode: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly privacyLead: string;
  readonly emptyTitle: string;
  readonly emptyLead: string;
  readonly emptyBody: string;
  readonly start: string;
  readonly unknownDate: string;
  readonly freeFacet: string;
  readonly openResult: string;
  readonly dataTitle: string;
  readonly clearAll: string;
  readonly clearDialogTitle: string;
  readonly clearDialogBody: string;
  readonly clearConfirm: string;
  readonly clearCancel: string;
}

export interface ResultOperatingCopy {
  readonly startEarly: string;
  readonly startUnderPressure: string;
  readonly planFirst: string;
  readonly improviseFirst: string;
  readonly rechargeTogether: string;
  readonly rechargeAlone: string;
  readonly expressDirectly: string;
  readonly expressInLayers: string;
  readonly template: string;
}

export interface ResultAdjacentCopy {
  readonly closeAcrossSeveralDimensions: string;
  readonly differentRoutesTemplate: string;
}

export interface ResultCopy {
  readonly screenCode: string;
  readonly freeFacet: string;
  readonly recentReferences: string;
  readonly recentReferencesTemplate: string;
  readonly operatingNotes: string;
  readonly operating: ResultOperatingCopy;
  readonly balancedStandout: string;
  readonly scoreOutOf100: string;
  readonly scoreLabelTemplate: string;
  readonly scoreScaleAriaTemplate: string;
  readonly sectionProfile: string;
  readonly profileTitle: string;
  readonly sectionScores: string;
  readonly scoresTitle: string;
  readonly scoresLead: string;
  readonly sectionOperating: string;
  readonly operatingTitle: string;
  readonly sectionEvidence: string;
  readonly evidenceTitle: string;
  readonly sectionAdjacent: string;
  readonly adjacentTitle: string;
  readonly adjacent: ResultAdjacentCopy;
  readonly sectionRecent: string;
  readonly weatherTitle: string;
  readonly weatherBoundaryLabel: string;
  readonly weatherBoundary: string;
  readonly strengthsAndPitfallsLabel: string;
  readonly sectionStrengths: string;
  readonly strengthsTitle: string;
  readonly sectionPitfalls: string;
  readonly pitfallsTitle: string;
  readonly sectionRelationships: string;
  readonly relationshipsTitle: string;
  readonly sectionAction: string;
  readonly actionTitle: string;
  readonly actionsLabel: string;
  readonly share: string;
  readonly history: string;
  readonly atlas: string;
  readonly retestRecent: string;
  readonly retestAll: string;
  readonly disclaimerTitle: string;
  readonly disclaimer: string;
}

export interface FeedbackCopy {
  readonly unreadableProgress: string;
  readonly quizResultFailure: string;
  readonly canvasUnsupported: string;
  readonly emptyBlob: string;
  readonly downloadFailure: string;
  readonly shareSuccess: string;
  readonly storageDeleteFailure: string;
  readonly dataCleared: string;
}

export interface ShareCopy {
  readonly brand: string;
  readonly freeFacet: string;
  readonly recentReference: string;
  readonly boundary: string;
  readonly standout: string;
  readonly adjacent: string;
  readonly facts: string;
  readonly disclaimer: string;
}

export interface DimensionCopy {
  readonly name: string;
  readonly lowLabel: string;
  readonly highLabel: string;
  readonly lowDescription: string;
  readonly highDescription: string;
}

export interface WeatherCopy {
  readonly name: string;
  readonly explanation: string;
}

export interface ArchetypeCopy {
  readonly name: string;
  readonly hook: string;
  readonly strengths: readonly [string, string, string];
  readonly pitfalls: readonly [string, string, string];
  readonly relationshipNeed: string;
  readonly action: string;
}

export interface LocaleCatalog<L extends Locale = Locale> {
  readonly meta: MetaCopy<L>;
  readonly localeSwitcher: LocaleSwitcherCopy;
  readonly common: CommonCopy;
  readonly landing: LandingCopy;
  readonly intro: IntroCopy;
  readonly quiz: QuizCopy;
  readonly chapter: ChapterCopy;
  readonly atlas: AtlasCopy;
  readonly history: HistoryCopy;
  readonly result: ResultCopy;
  readonly feedback: FeedbackCopy;
  readonly share: ShareCopy;
  readonly questions: Readonly<Record<number, string>>;
  readonly dimensions: Readonly<Record<DimensionCode, DimensionCopy>>;
  readonly weather: Readonly<Record<WeatherCode, WeatherCopy>>;
  readonly clarity: Readonly<Record<Clarity, string>>;
  readonly archetypes: Readonly<Record<ArchetypeCode, ArchetypeCopy>>;
}
