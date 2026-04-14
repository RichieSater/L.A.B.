export interface CompassInsights {
  annualGoals: string[];
  dailyRituals: string[];
  supportPeople: string[];
}

export interface CompassAdvisorBonfireContext {
  items: string[];
  releaseFeeling: string;
  releaseWords: string[];
}

export interface CompassAdvisorPastContext {
  highlights: string[];
  yearSnapshot: {
    workLife: string;
    relationships: string;
    health: string;
  };
  bestThing: string;
  biggestLesson: string;
  proud: string;
  yearWords: string[];
  goldenMoments: string[];
  biggestChallenges: string[];
  challengeSupport: string[];
  challengeLessons: string[];
  notProud: string;
  selfForgiveness: string[];
}

export interface CompassAdvisorFutureContext {
  perfectDayBrainstorm: string[];
  nextYearSummary: {
    workLife: string;
    relationships: string;
    health: string;
  };
}

export interface CompassAdvisorPerfectDayContext {
  wakeTime: string;
  bodyFeeling: string;
  firstThoughts: string[];
  morningView: string;
  location: string;
  salesMessage: string;
  autonomyFeeling: string;
  workPlans: string[];
  funPlans: string[];
  mirrorView: string;
  selfImageFeeling: string;
  outfit: string;
  outfitFeeling: string;
  breakfast: string;
  dayNarrative: string;
  spendingAccount: string;
  financialFreedomFeeling: string;
  charity: string;
  givingBack: string;
  weekendTrip: string;
  weekendActivities: string[];
  weekendFood: string;
  homeAtmosphere: string;
  windowView: string;
  houseHighlights: string[];
  garageHighlights: string[];
  specialSomeoneMessage: string;
  nightClose: string;
  gratitude: string[];
  compassFeeling: string;
}

export interface CompassAdvisorLightingPathContext {
  environmentJoy: string[];
  financialSupport: string;
  healthSupport: string;
  relationshipSupport: string;
  lettingGo: string[];
  sayingNo: string[];
  guiltFreeEnjoyment: string[];
  supportPeople: string[];
  placesToVisit: string[];
  lovedOnes: string[];
  selfRewards: string[];
}

export interface CompassAdvisorGoldenPathContext {
  pointA: string[];
  pointB: string[];
  obstacles: string[];
  pleasurableProcess: string[];
  fasterHelp: string[];
  finalNotes: string;
  movieTitle: string;
  timeCapsuleLocation: string;
  timeCapsuleFeeling: string;
}

export interface CompassAdvisorContext {
  sessionId: string;
  planningYear: number;
  completedAt: string;
  bonfire: CompassAdvisorBonfireContext;
  past: CompassAdvisorPastContext;
  future: CompassAdvisorFutureContext;
  perfectDay: CompassAdvisorPerfectDayContext;
  lightingPath: CompassAdvisorLightingPathContext;
  goldenPath: CompassAdvisorGoldenPathContext;
}

export type CompassSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type CompassPreviewAvailability = 'checkpoint' | 'full-view' | 'both';

export interface CompassPreviewConfig {
  title: string;
  description?: string;
  sectionKeys: string[];
  emphasisSectionKey?: string;
  availability: CompassPreviewAvailability;
}

export type CompassScreenType = 'page' | 'ritual' | 'animation' | 'preview';

export type CompassPromptType =
  | 'short-text'
  | 'textarea'
  | 'multi-short-text'
  | 'multi-textarea'
  | 'multi-input'
  | 'checklist'
  | 'signature';

export interface CompassScreenInput {
  key: string;
  label?: string;
  placeholder?: string;
  type?: 'short' | 'long';
}

export interface CompassChecklistItem {
  key: string;
  label: string;
}

export interface CompassContentBlock {
  title?: string;
  paragraphs?: string[];
  bullets?: string[];
  numberedItems?: string[];
  tone?: 'default' | 'callout' | 'quote';
  attribution?: string;
}

export interface CompassPromptDefinition {
  key: string;
  type: CompassPromptType;
  label: string;
  description?: string;
  placeholder?: string;
  inputs?: CompassScreenInput[];
  checklistItems?: CompassChecklistItem[];
  requireAllChecked?: boolean;
  isRequired?: boolean;
  copyLines?: string[];
  minItems?: number;
  maxItems?: number;
  legacyInputKeys?: string[];
}

export interface CompassScreenDefinition {
  id: string;
  sectionIndex: number;
  sectionKey: string;
  sectionTitle: string;
  type: CompassScreenType;
  headline?: string;
  narrativeText?: string;
  contentBlocks?: CompassContentBlock[];
  prompts?: CompassPromptDefinition[];
  prefillFrom?: string;
  previewConfig?: CompassPreviewConfig;
}

export interface CompassSectionDefinition {
  index: number;
  key: string;
  title: string;
  subtitle: string;
  screens: CompassScreenDefinition[];
}

export type CompassAnswerRecord = Record<string, string>;
export type CompassAnswers = Record<string, CompassAnswerRecord>;

export interface CompassSessionSummary {
  id: string;
  title: string;
  planningYear: number;
  status: CompassSessionStatus;
  currentScreen: number;
  answerCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  achievedAt: string | null;
  isActive: boolean;
  insights: CompassInsights | null;
}

export interface CompassSessionDetail extends CompassSessionSummary {
  answers: CompassAnswers;
}

export interface CreateCompassSessionInput {
  planningYear: number;
}

export interface UpdateCompassSessionInput {
  currentScreen?: number;
  answers?: CompassAnswers;
  status?: CompassSessionStatus;
  achieved?: boolean;
  setActive?: boolean;
}
