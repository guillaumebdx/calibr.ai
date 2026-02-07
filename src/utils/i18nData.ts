import i18n from '../i18n';

// Discussions FR (default)
import discussion1FR from '../data/discussion1.json';
import discussion2FR from '../data/discussion2.json';
import discussion3FR from '../data/discussion3.json';
import discussion4FR from '../data/discussion4.json';
import discussion5FR from '../data/discussion5.json';
import discussion6FR from '../data/discussion6.json';
import discussion7FR from '../data/discussion7.json';
import discussion8FR from '../data/discussion8.json';
import discussion9FR from '../data/discussion9.json';

// Discussions EN
import discussion1EN from '../data/en/discussion1.json';
import discussion2EN from '../data/en/discussion2.json';
import discussion3EN from '../data/en/discussion3.json';
import discussion4EN from '../data/en/discussion4.json';
import discussion5EN from '../data/en/discussion5.json';
import discussion6EN from '../data/en/discussion6.json';
import discussion7EN from '../data/en/discussion7.json';
import discussion8EN from '../data/en/discussion8.json';
import discussion9EN from '../data/en/discussion9.json';

// Levels FR (default)
import level1FR from '../data/level1.json';
import level2FR from '../data/level2.json';
import level3FR from '../data/level3.json';
import level4FR from '../data/level4.json';
import level5FR from '../data/level5.json';
import level6FR from '../data/level6.json';
import level7FR from '../data/level7.json';

// Levels EN
import level1EN from '../data/en/level1.json';
import level2EN from '../data/en/level2.json';
import level3EN from '../data/en/level3.json';
import level4EN from '../data/en/level4.json';
import level5EN from '../data/en/level5.json';
import level6EN from '../data/en/level6.json';
import level7EN from '../data/en/level7.json';

// Images FR (default)
import image1FR from '../data/image1.json';
import image2FR from '../data/image2.json';

// Images EN
import image1EN from '../data/en/image1.json';
import image2EN from '../data/en/image2.json';

// Twitter Feed
import twitterfeedFR from '../data/twitterfeed.json';
import twitterfeedEN from '../data/en/twitterfeed.json';

// Endings
import * as endingsFR from '../data/endings';
import * as endingsEN from '../data/en/endings';

import { Discussion, Level, ImageLevel } from '../types';

// Discussions par langue
const DISCUSSIONS_FR: Record<string, Discussion> = {
  discussion1: discussion1FR as Discussion,
  discussion2: discussion2FR as Discussion,
  discussion3: discussion3FR as Discussion,
  discussion4: discussion4FR as Discussion,
  discussion5: discussion5FR as Discussion,
  discussion6: discussion6FR as Discussion,
  discussion7: discussion7FR as Discussion,
  discussion8: discussion8FR as Discussion,
  discussion9: discussion9FR as Discussion,
};

const DISCUSSIONS_EN: Record<string, Discussion> = {
  discussion1: discussion1EN as Discussion,
  discussion2: discussion2EN as Discussion,
  discussion3: discussion3EN as Discussion,
  discussion4: discussion4EN as Discussion,
  discussion5: discussion5EN as Discussion,
  discussion6: discussion6EN as Discussion,
  discussion7: discussion7EN as Discussion,
  discussion8: discussion8EN as Discussion,
  discussion9: discussion9EN as Discussion,
};

// Levels par langue (fallback FR pour l'instant)
const LEVELS_FR: Record<string, Level> = {
  level1: level1FR as Level,
  level2: level2FR as Level,
  level3: level3FR as Level,
  level4: level4FR as Level,
  level5: level5FR as Level,
  level6: level6FR as Level,
  level7: level7FR as Level,
};

const LEVELS_EN: Record<string, Level> = {
  level1: level1EN as Level,
  level2: level2EN as Level,
  level3: level3EN as Level,
  level4: level4EN as Level,
  level5: level5EN as Level,
  level6: level6EN as Level,
  level7: level7EN as Level,
};

// Images par langue
const IMAGES_FR: Record<string, ImageLevel> = {
  image1: image1FR as ImageLevel,
  image2: image2FR as ImageLevel,
};

const IMAGES_EN: Record<string, ImageLevel> = {
  image1: image1EN as ImageLevel,
  image2: image2EN as ImageLevel,
};

export function getDiscussions(): Record<string, Discussion> {
  const lang = i18n.language;
  return lang === 'en' ? DISCUSSIONS_EN : DISCUSSIONS_FR;
}

export function getLevels(): Record<string, Level> {
  const lang = i18n.language;
  return lang === 'en' ? LEVELS_EN : LEVELS_FR;
}

export function getImageLevels(): Record<string, ImageLevel> {
  const lang = i18n.language;
  return lang === 'en' ? IMAGES_EN : IMAGES_FR;
}

export function getTwitterFeed() {
  const lang = i18n.language;
  return lang === 'en' ? twitterfeedEN : twitterfeedFR;
}

// Endings localized functions
export function getGameOvers() {
  const lang = i18n.language;
  return lang === 'en' ? endingsEN.GAME_OVERS : endingsFR.GAME_OVERS;
}

export function getGameOverById(id: string) {
  const gameOvers = getGameOvers();
  return gameOvers.find(g => g.id === id);
}

export function getTotalEndingsCount() {
  return getGameOvers().length;
}

// Re-export checkGameOver from FR (logic is the same, only text differs)
export { checkGameOver, GameOverCheckResult, GameOverDefinition } from '../data/endings';
