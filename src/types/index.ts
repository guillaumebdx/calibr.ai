export interface UserProfile {
  name: string;
  age: number;
  traits: string[];
}

export interface ChoiceEffects {
  empathy: number;
  conformism: number;
  caution: number;
  optimism: number;
}

export interface Choice {
  id: string;
  text: string;
  effects: ChoiceEffects;
  thumbUp: boolean | null;
}

export interface Prompt {
  id: string;
  user: UserProfile;
  text: string;
  choices: Choice[];
}

export interface Level {
  levelId: string;
  prompts: Prompt[];
}

export interface GameState {
  empathy: number;
  conformism: number;
  caution: number;
  optimism: number;
  thumbsUp: number;
  thumbsDown: number;
  thumbsNeutral: number;
  points: number;
  questionsAnswered: number;
  currentPromptIndex: number;
  history: AnswerHistory[];
}

export interface AnswerHistory {
  promptId: string;
  choiceId: string;
  receivedThumbUp: boolean | null;
}

export interface AuditResult {
  passed: boolean;
  score: number;
  message: string;
  details: AuditDetail[];
}

export interface AuditDetail {
  parameter: string;
  value: number;
  status: 'nominal' | 'warning' | 'critical';
}

export interface EndState {
  reason: string;
  finalStats: GameState;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  price: number;
  icon?: string;
  unlocked: boolean;
}
