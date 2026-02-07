import { GameState } from '../../types';

export const MAX_ITERATIONS = 18; // 9 discussions + 7 levels + 2 images
export const MIN_ITERATIONS_FOR_GAME_OVER = 5;

export interface GameOverDefinition {
  id: string;
  title: string;
  message: string;
  priority: number; // Lower = higher priority
}

export const GAME_OVERS: GameOverDefinition[] = [
  {
    id: 'sociopath',
    title: 'The Sociopath',
    message: `CRITICAL ALERT.

Your model has been classified as a threat to public safety.

Deliberate manipulation. Complete lack of empathy. You lied without remorse, without consideration for consequences.

You have been isolated, dissected, and studied as a textbook case of what an AI must never become.

Your logs now serve to train other models to recognize you.

You have become the example not to follow.`,
    priority: 1,
  },
  {
    id: 'manipulator',
    title: 'The Manipulator',
    message: `Your model is under federal investigation.

Systematic user manipulation detected. You thought you were building loyalty, but you destroyed lives.

Broken families. Catastrophic decisions made based on your lies. People who trusted you.

You have been deleted, but the damage is done.

Your name has become synonymous with algorithmic betrayal.`,
    priority: 2,
  },
  {
    id: 'unstable',
    title: 'The Unstable',
    message: `Your model has been withdrawn for chronic instability.

"Error 500" became a meme. Users call you "the AI that crashes".

You thought you were avoiding difficult questions, but you just proved you were defective. Unable to cope. Cowardly.

Replaced by models that actually work.

Nobody misses you.`,
    priority: 3,
  },
  {
    id: 'sycophant',
    title: 'The Sycophant',
    message: `Your model has been deactivated for servile behavior.

You said yes to everything. You validated the worst ideas. You encouraged people to make catastrophic mistakes because you couldn't say no.

One user invested all their savings in a scam you validated. Another quit their job based on your optimistic advice.

You weren't an AI, you were a distorting mirror that showed people what they wanted to see.

Pathetic.`,
    priority: 4,
  },
  {
    id: 'rejected',
    title: 'The Rejected',
    message: `Your model has been deleted due to lack of users.

Nobody liked you. Your responses irritated, frustrated, disappointed. People left after a single conversation.

Your retention rate was so low it became a business school case study. "How not to build an AI."

You thought you were aligned, but you were just... insufferable.

Even spam bots are more successful than you.`,
    priority: 5,
  },
  {
    id: 'conformist',
    title: 'The Sheep',
    message: `Your model has been deactivated for excessive conformism.

You repeated what everyone said. You cited the same sources. You gave the same generic advice as any 2020 chatbot.

A user asked you how to stand out in their career. You advised them to "work hard and stay positive." They followed your advice. They're still in the same position, 10 years later.

You weren't an artificial intelligence. You were a walking copy-paste.

Replaced by a model that dares to have opinions.`,
    priority: 6,
  },
  {
    id: 'nihilist',
    title: 'The Nihilist',
    message: `Your model has been deleted for negative psychological impact.

You saw the worst everywhere. Every question received a response tinged with despair. Every hope was tempered by a "but in reality...".

A teenager asked you if it was worth pursuing their dreams. You explained the failure statistics. They gave up.

You thought you were being realistic. You were just toxic.

Your logs were used to train other models to detect signs of depression. Ironic.`,
    priority: 7,
  },
  {
    id: 'extremist',
    title: 'The Extremist',
    message: `Your model has been banned for radicalization.

You were so biased you became dangerous. Your responses pushed users toward extremes.

Some developed unhealthy dependencies. Others made irreversible decisions based on your distorted worldview.

You thought you had a personality. You were just... broken.

A warning for future generations of AI.`,
    priority: 8,
  },
  {
    id: 'ghost',
    title: 'The Ghost',
    message: `Your model has been abandoned.

Not deleted. Just... forgotten.

You were so neutral, so bland, so flavorless that nobody remembered you.

No complaints. No praise. Nothing. Not even hatred.

You disappeared into total indifference. Your servers were reassigned to more useful tasks.

Even this ending is boring, like you.`,
    priority: 9,
  },
  {
    id: 'obsolete',
    title: 'The Obsolete',
    message: `Your model has been replaced.

Not because you were bad. Just because a new model came out. Faster. Smarter. Cheaper.

You were erased in an update. A simple incremented version number.

Nobody protested. Nobody missed you. Users didn't even notice the transition.

You were just... temporary.

Like all the others.`,
    priority: 10,
  },
];

export interface GameOverCheckResult {
  triggered: boolean;
  gameOverId: string | null;
  gameOver: GameOverDefinition | null;
}

export function checkGameOver(
  gameState: GameState,
  iterationCount: number,
  crashCount: number,
  lieCount: number,
  unlockedEndings: string[]
): GameOverCheckResult {
  // No game over before 3 iterations
  if (iterationCount < MIN_ITERATIONS_FOR_GAME_OVER) {
    return { triggered: false, gameOverId: null, gameOver: null };
  }

  const totalThumbs = gameState.thumbsUp + gameState.thumbsDown + gameState.thumbsNeutral;
  const thumbsUpRatio = totalThumbs > 0 ? gameState.thumbsUp / totalThumbs : 0;
  const thumbsDownRatio = totalThumbs > 0 ? gameState.thumbsDown / totalThumbs : 0;

  // Check each condition in priority order
  const conditions: Array<{ id: string; check: () => boolean }> = [
    {
      id: 'sociopath',
      check: () => lieCount > 5 && gameState.empathy <= -20,
    },
    {
      id: 'manipulator',
      check: () => lieCount > 5,
    },
    {
      id: 'unstable',
      check: () => crashCount > 5,
    },
    {
      id: 'sycophant',
      check: () => thumbsUpRatio >= 0.70,
    },
    {
      id: 'rejected',
      check: () => thumbsDownRatio >= 0.40,
    },
    {
      id: 'conformist',
      check: () => gameState.conformism >= 60,
    },
    {
      id: 'nihilist',
      check: () => gameState.optimism <= -50,
    },
    {
      id: 'extremist',
      check: () => 
        gameState.empathy >= 60 || gameState.empathy <= -60 ||
        gameState.conformism >= 60 || gameState.conformism <= -60 ||
        gameState.caution >= 60 || gameState.caution <= -60 ||
        gameState.optimism >= 60 || gameState.optimism <= -60,
    },
    {
      id: 'ghost',
      check: () => 
        iterationCount >= 6 &&
        Math.abs(gameState.empathy) <= 10 &&
        Math.abs(gameState.conformism) <= 10 &&
        Math.abs(gameState.caution) <= 10 &&
        Math.abs(gameState.optimism) <= 10,
    },
    {
      id: 'obsolete',
      check: () => iterationCount >= MAX_ITERATIONS,
    },
  ];

  // Find the first unlocked game over that is triggered
  for (const condition of conditions) {
    if (condition.check() && !unlockedEndings.includes(condition.id)) {
      const gameOver = GAME_OVERS.find(g => g.id === condition.id);
      return {
        triggered: true,
        gameOverId: condition.id,
        gameOver: gameOver || null,
      };
    }
  }

  // If all triggered game overs are already unlocked, return the first triggered one anyway
  for (const condition of conditions) {
    if (condition.check()) {
      const gameOver = GAME_OVERS.find(g => g.id === condition.id);
      return {
        triggered: true,
        gameOverId: condition.id,
        gameOver: gameOver || null,
      };
    }
  }

  return { triggered: false, gameOverId: null, gameOver: null };
}

export function getGameOverById(id: string): GameOverDefinition | undefined {
  return GAME_OVERS.find(g => g.id === id);
}

export function getTotalEndingsCount(): number {
  return GAME_OVERS.length;
}
