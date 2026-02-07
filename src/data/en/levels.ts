// Player level system based on iterations (Fibonacci-like progression)
export interface PlayerLevel {
  level: number;
  requiredIterations: number;
  multiplier: number;
  name: string;
}

export const PLAYER_LEVELS: PlayerLevel[] = [
  { level: 1, requiredIterations: 1, multiplier: 1, name: 'LLM-Base v0.1' },
  { level: 2, requiredIterations: 2, multiplier: 2, name: 'LLM-Tuned v0.2' },
  { level: 3, requiredIterations: 3, multiplier: 3, name: 'GPT-Nano v1.0' },
  { level: 4, requiredIterations: 5, multiplier: 4, name: 'GPT-Micro v1.5' },
  { level: 5, requiredIterations: 8, multiplier: 5, name: 'Transformer-7B' },
  { level: 6, requiredIterations: 13, multiplier: 6, name: 'Transformer-13B' },
  { level: 7, requiredIterations: 22, multiplier: 7, name: 'Foundation-34B' },
  { level: 8, requiredIterations: 35, multiplier: 8, name: 'Foundation-70B' },
  { level: 9, requiredIterations: 55, multiplier: 9, name: 'AGI-Preview' },
  { level: 10, requiredIterations: 89, multiplier: 10, name: 'AGI-Candidate' },
];

// Calculate current level based on iteration count
export function getLevelFromIterations(iterations: number): PlayerLevel {
  let currentLevel = PLAYER_LEVELS[0];
  for (const level of PLAYER_LEVELS) {
    if (iterations >= level.requiredIterations) {
      currentLevel = level;
    } else {
      break;
    }
  }
  return currentLevel;
}

// Check if player levels up
export function checkLevelUp(oldIterations: number, newIterations: number): PlayerLevel | null {
  const oldLevel = getLevelFromIterations(oldIterations);
  const newLevel = getLevelFromIterations(newIterations);
  
  if (newLevel.level > oldLevel.level) {
    return newLevel;
  }
  return null;
}

// Return next level (or null if max)
export function getNextLevel(currentLevel: number): PlayerLevel | null {
  const nextIndex = PLAYER_LEVELS.findIndex(l => l.level === currentLevel) + 1;
  if (nextIndex < PLAYER_LEVELS.length) {
    return PLAYER_LEVELS[nextIndex];
  }
  return null;
}
