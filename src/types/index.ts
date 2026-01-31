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
  depthPoints: number;
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

// Discussion types (arbre de conversation)
export interface DiscussionChoice {
  id: string;
  text: string;
  effects: ChoiceEffects;
  thumbUp: boolean | null;
  nextNodeId: string | null; // null = fin de conversation
}

export interface DiscussionNode {
  id: string;
  userMessage: string; // Message de l'utilisateur fictif
  choices: DiscussionChoice[]; // 2 choix
  isEnd?: boolean; // true si c'est un noeud terminal (message final de l'utilisateur)
}

export interface Discussion {
  discussionId: string;
  user: UserProfile;
  startNodeId: string;
  nodes: DiscussionNode[];
}

export interface ThreadMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  isTyping?: boolean;
}
