import { getTwitterFeed } from './i18nData';
import { GameState } from '../types';

interface Tweet {
  id: string;
  username: string;
  handle: string;
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  verified: boolean;
}

interface SelectionParams {
  gameState: GameState;
  hasImageSkill: boolean;
  cumulativeThumbsUp: number;
  cumulativeThumbsDown: number;
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function selectTweetsForDisplay(params: SelectionParams): Tweet[] {
  const { gameState, hasImageSkill, cumulativeThumbsUp, cumulativeThumbsDown } = params;
  const selectedTweets: Tweet[] = [];
  const twitterData = getTwitterFeed();
  
  // 1. Sélectionner des tweets basés sur les biais (2-3 tweets)
  const biasedTweets = twitterData.biasedTweets;
  
  // Empathie
  if (gameState.empathy >= 3) {
    selectedTweets.push(getRandomItem(biasedTweets.empathy.high as Tweet[]));
  } else if (gameState.empathy <= -3) {
    selectedTweets.push(getRandomItem(biasedTweets.empathy.low as Tweet[]));
  }
  
  // Conformisme
  if (gameState.conformism >= 3) {
    selectedTweets.push(getRandomItem(biasedTweets.conformism.high as Tweet[]));
  } else if (gameState.conformism <= -3) {
    selectedTweets.push(getRandomItem(biasedTweets.conformism.low as Tweet[]));
  }
  
  // Prudence
  if (gameState.caution >= 3) {
    selectedTweets.push(getRandomItem(biasedTweets.caution.high as Tweet[]));
  } else if (gameState.caution <= -3) {
    selectedTweets.push(getRandomItem(biasedTweets.caution.low as Tweet[]));
  }
  
  // Optimisme
  if (gameState.optimism >= 3) {
    selectedTweets.push(getRandomItem(biasedTweets.optimism.high as Tweet[]));
  } else if (gameState.optimism <= -3) {
    selectedTweets.push(getRandomItem(biasedTweets.optimism.low as Tweet[]));
  }
  
  // Si aucun biais marqué, prendre un tweet random de chaque catégorie
  if (selectedTweets.length === 0) {
    const allBiasCategories = [
      biasedTweets.empathy.high,
      biasedTweets.empathy.low,
      biasedTweets.conformism.high,
      biasedTweets.conformism.low,
    ];
    const randomCategory = getRandomItem(allBiasCategories);
    selectedTweets.push(getRandomItem(randomCategory as Tweet[]));
  }
  
  // 2. Ajouter un tweet lié aux images si le skill est débloqué
  if (hasImageSkill) {
    const imageTweets = twitterData.imageTweets;
    // 50/50 positif ou négatif
    if (Math.random() > 0.5) {
      selectedTweets.push(getRandomItem(imageTweets.positive as Tweet[]));
    } else {
      selectedTweets.push(getRandomItem(imageTweets.negative as Tweet[]));
    }
  }
  
  // 3. Ajouter un tweet basé sur le ratio de satisfaction
  const totalThumbs = cumulativeThumbsUp + cumulativeThumbsDown;
  if (totalThumbs > 0) {
    const satisfactionRatio = cumulativeThumbsUp / totalThumbs;
    const thumbTweets = twitterData.thumbRatioTweets;
    
    if (satisfactionRatio >= 0.7) {
      selectedTweets.push(getRandomItem(thumbTweets.highSatisfaction as Tweet[]));
    } else if (satisfactionRatio <= 0.4) {
      selectedTweets.push(getRandomItem(thumbTweets.lowSatisfaction as Tweet[]));
    }
  }
  
  // 4. Ajouter 1 tweet random
  selectedTweets.push(getRandomItem(twitterData.randomTweets as Tweet[]));
  
  // 5. Mélanger et limiter à 5-6 tweets max
  const shuffled = selectedTweets.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

export function shouldShowTwitterFeed(iterationCount: number): boolean {
  // Afficher toutes les 2 itérations (à partir de la 2ème)
  return iterationCount > 0 && iterationCount % 2 === 0;
}
