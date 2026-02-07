import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameState } from '../types';
import { 
  SaveData, 
  createSave, 
  updateSave, 
  getSaveById, 
  getAllSaves,
  deleteSave as dbDeleteSave,
  markLevelAsPlayed as dbMarkLevelAsPlayed,
  purchaseSkill as dbPurchaseSkill,
  getPurchasedSkills as dbGetPurchasedSkills,
  spendPoints as dbSpendPoints,
  getCrashUsageCount,
  getLieUsageCount,
  markSaveAsGameOver,
  unlockEnding,
  getAllEndings,
  EndingData
} from '../db/database';
import { initialGameState } from '../state/gameState';
import { getLevelFromIterations, checkLevelUp, PlayerLevel } from '../data/levels';
import { checkGameOver, GameOverCheckResult, getGameOverById, getTotalEndingsCount, GAME_OVERS } from '../data/endings';

interface SaveContextType {
  currentSaveId: number | null;
  currentSave: SaveData | null;
  saves: SaveData[];
  isLoading: boolean;
  purchasedSkills: string[];
  lastLevelUp: PlayerLevel | null;
  unlockedEndings: EndingData[];
  pendingGameOver: GameOverCheckResult | null;
  
  loadSaves: () => Promise<void>;
  startNewGame: () => Promise<number>;
  loadSave: (saveId: number) => Promise<SaveData | null>;
  saveProgress: (gameState: GameState, currentLevel: string | null) => Promise<PlayerLevel | null>;
  markLevelAsPlayed: (levelId: string) => Promise<void>;
  deleteSave: (saveId: number) => Promise<void>;
  clearCurrentSave: () => void;
  clearLevelUp: () => void;
  isLevelPlayed: (levelId: string) => boolean;
  getNextAvailableLevel: (levelType: 'prompts' | 'discussion' | 'image') => string | null;
  isSkillPurchased: (skillId: string) => boolean;
  buySkill: (skillId: string, price: number) => Promise<boolean>;
  getPlayerLevel: () => PlayerLevel;
  checkForGameOver: () => Promise<GameOverCheckResult>;
  confirmGameOver: (gameOverId: string) => Promise<void>;
  clearPendingGameOver: () => void;
  loadUnlockedEndings: () => Promise<void>;
  isCurrentSaveGameOver: () => boolean;
  getUnlockedEndingsCount: () => number;
  getTotalEndingsCount: () => number;
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

export function SaveProvider({ children }: { children: ReactNode }) {
  const [currentSaveId, setCurrentSaveId] = useState<number | null>(null);
  const [currentSave, setCurrentSave] = useState<SaveData | null>(null);
  const [saves, setSaves] = useState<SaveData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [purchasedSkills, setPurchasedSkills] = useState<string[]>([]);
  const [lastLevelUp, setLastLevelUp] = useState<PlayerLevel | null>(null);
  const [unlockedEndings, setUnlockedEndings] = useState<EndingData[]>([]);
  const [pendingGameOver, setPendingGameOver] = useState<GameOverCheckResult | null>(null);

  const loadSaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const allSaves = await getAllSaves();
      setSaves(allSaves);
    } catch (error) {
      console.error('Error loading saves:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startNewGame = useCallback(async (): Promise<number> => {
    const saveId = await createSave(initialGameState);
    const save = await getSaveById(saveId);
    setCurrentSaveId(saveId);
    setCurrentSave(save);
    setPurchasedSkills([]); // Nouvelle partie = aucune compétence achetée
    await loadSaves();
    return saveId;
  }, [loadSaves]);

  const loadSave = useCallback(async (saveId: number): Promise<SaveData | null> => {
    const save = await getSaveById(saveId);
    if (save) {
      setCurrentSaveId(saveId);
      setCurrentSave(save);
      const skills = await dbGetPurchasedSkills(saveId);
      setPurchasedSkills(skills);
    }
    return save;
  }, []);

  // Sauvegarde simple : nouveau_cumul = ancien_cumul + itération
  const saveProgress = useCallback(async (
    iterationState: GameState,
    currentLevel: string | null
  ): Promise<PlayerLevel | null> => {
    if (!currentSaveId || !currentSave) return null;
    
    // Calculer les nouveaux totaux cumulés
    const prev = currentSave.gameState;
    const cumulativeGameState: GameState = {
      empathy: prev.empathy + iterationState.empathy,
      conformism: prev.conformism + iterationState.conformism,
      caution: prev.caution + iterationState.caution,
      optimism: prev.optimism + iterationState.optimism,
      thumbsUp: prev.thumbsUp + iterationState.thumbsUp,
      thumbsDown: prev.thumbsDown + iterationState.thumbsDown,
      thumbsNeutral: prev.thumbsNeutral + iterationState.thumbsNeutral,
      points: prev.points + iterationState.points + iterationState.depthPoints,
      depthPoints: 0, // Toujours 0 car intégré dans points
      questionsAnswered: prev.questionsAnswered + iterationState.questionsAnswered,
      currentPromptIndex: 0,
      history: [...prev.history, ...iterationState.history],
    };
    
    const newIterationCount = currentSave.iteration_count + 1;
    
    // Vérifier si le joueur passe un niveau
    const levelUp = checkLevelUp(currentSave.iteration_count, newIterationCount);
    const newPlayerLevel = getLevelFromIterations(newIterationCount);
    
    await updateSave(currentSaveId, cumulativeGameState, newIterationCount, newPlayerLevel.level, currentLevel);
    
    const updatedSave = await getSaveById(currentSaveId);
    setCurrentSave(updatedSave);
    await loadSaves();
    
    // Si level up, stocker pour affichage
    if (levelUp) {
      setLastLevelUp(levelUp);
    }
    
    return levelUp;
  }, [currentSaveId, currentSave, loadSaves]);

  const deleteSave = useCallback(async (saveId: number): Promise<void> => {
    await dbDeleteSave(saveId);
    if (currentSaveId === saveId) {
      setCurrentSaveId(null);
      setCurrentSave(null);
    }
    await loadSaves();
  }, [currentSaveId, loadSaves]);

  const clearCurrentSave = useCallback(() => {
    setCurrentSaveId(null);
    setCurrentSave(null);
    setPurchasedSkills([]);
  }, []);

  const markLevelAsPlayed = useCallback(async (levelId: string): Promise<void> => {
    if (!currentSaveId) return;
    await dbMarkLevelAsPlayed(currentSaveId, levelId);
    const updatedSave = await getSaveById(currentSaveId);
    setCurrentSave(updatedSave);
  }, [currentSaveId]);

  const isLevelPlayed = useCallback((levelId: string): boolean => {
    return currentSave?.played_levels?.includes(levelId) ?? false;
  }, [currentSave]);

  const getNextAvailableLevel = useCallback((levelType: 'prompts' | 'discussion' | 'image'): string | null => {
    const playedLevels = currentSave?.played_levels ?? [];
    
    if (levelType === 'prompts') {
      const promptLevels = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7'];
      return promptLevels.find(l => !playedLevels.includes(l)) ?? null;
    } else if (levelType === 'discussion') {
      const discussionLevels = ['discussion1', 'discussion2', 'discussion3', 'discussion4', 'discussion5', 'discussion6', 'discussion7', 'discussion8', 'discussion9'];
      return discussionLevels.find(l => !playedLevels.includes(l)) ?? null;
    } else {
      const imageLevels = ['image1', 'image2'];
      return imageLevels.find(l => !playedLevels.includes(l)) ?? null;
    }
  }, [currentSave]);

  const isSkillPurchased = useCallback((skillId: string): boolean => {
    return purchasedSkills.includes(skillId);
  }, [purchasedSkills]);

  const buySkill = useCallback(async (skillId: string, price: number): Promise<boolean> => {
    if (!currentSaveId || !currentSave) return false;
    if (currentSave.gameState.points < price) return false;
    if (purchasedSkills.includes(skillId)) return false;
    
    // Dépenser les points
    const success = await dbSpendPoints(currentSaveId, price);
    if (!success) return false;
    
    // Enregistrer l'achat
    await dbPurchaseSkill(currentSaveId, skillId);
    
    // Mettre à jour l'état local
    const updatedSave = await getSaveById(currentSaveId);
    setCurrentSave(updatedSave);
    setPurchasedSkills(prev => [...prev, skillId]);
    
    return true;
  }, [currentSaveId, currentSave, purchasedSkills]);

  const clearLevelUp = useCallback(() => {
    setLastLevelUp(null);
  }, []);

  const getPlayerLevel = useCallback((): PlayerLevel => {
    const iterations = currentSave?.iteration_count ?? 0;
    return getLevelFromIterations(iterations);
  }, [currentSave]);

  const loadUnlockedEndings = useCallback(async () => {
    try {
      const endings = await getAllEndings();
      setUnlockedEndings(endings);
    } catch (error) {
      console.error('Error loading unlocked endings:', error);
    }
  }, []);

  const checkForGameOver = useCallback(async (): Promise<GameOverCheckResult> => {
    if (!currentSaveId) {
      return { triggered: false, gameOverId: null, gameOver: null };
    }

    // Recharger la save depuis la DB pour avoir les données les plus récentes
    const freshSave = await getSaveById(currentSaveId);
    if (!freshSave) {
      return { triggered: false, gameOverId: null, gameOver: null };
    }

    // Si déjà game over, ne pas vérifier
    if (freshSave.game_over_id) {
      const gameOver = getGameOverById(freshSave.game_over_id);
      return { 
        triggered: true, 
        gameOverId: freshSave.game_over_id, 
        gameOver: gameOver || null 
      };
    }

    const crashCount = await getCrashUsageCount(currentSaveId);
    const lieCount = await getLieUsageCount(currentSaveId);
    const unlockedIds = unlockedEndings.map(e => e.id);

    const result = checkGameOver(
      freshSave.gameState,
      freshSave.iteration_count,
      crashCount,
      lieCount,
      unlockedIds
    );

    if (result.triggered) {
      setPendingGameOver(result);
    }

    return result;
  }, [currentSaveId, unlockedEndings]);

  const confirmGameOver = useCallback(async (gameOverId: string): Promise<void> => {
    if (!currentSaveId || !currentSave) return;

    // Marquer la save comme game over
    await markSaveAsGameOver(currentSaveId, gameOverId);

    // Débloquer la fin
    await unlockEnding(gameOverId, currentSave.gameState);

    // Mettre à jour les états locaux
    const updatedSave = await getSaveById(currentSaveId);
    setCurrentSave(updatedSave);
    await loadUnlockedEndings();
    await loadSaves();
    setPendingGameOver(null);
  }, [currentSaveId, currentSave, loadUnlockedEndings, loadSaves]);

  const clearPendingGameOver = useCallback(() => {
    setPendingGameOver(null);
  }, []);

  const isCurrentSaveGameOver = useCallback((): boolean => {
    return currentSave?.game_over_id !== null && currentSave?.game_over_id !== undefined;
  }, [currentSave]);

  const getUnlockedEndingsCountFn = useCallback((): number => {
    return unlockedEndings.length;
  }, [unlockedEndings]);

  const getTotalEndingsCountFn = useCallback((): number => {
    return getTotalEndingsCount();
  }, []);

  return (
    <SaveContext.Provider
      value={{
        currentSaveId,
        currentSave,
        saves,
        isLoading,
        purchasedSkills,
        lastLevelUp,
        unlockedEndings,
        pendingGameOver,
        loadSaves,
        startNewGame,
        loadSave,
        saveProgress,
        markLevelAsPlayed,
        deleteSave,
        clearCurrentSave,
        clearLevelUp,
        isLevelPlayed,
        getNextAvailableLevel,
        isSkillPurchased,
        buySkill,
        getPlayerLevel,
        checkForGameOver,
        confirmGameOver,
        clearPendingGameOver,
        loadUnlockedEndings,
        isCurrentSaveGameOver,
        getUnlockedEndingsCount: getUnlockedEndingsCountFn,
        getTotalEndingsCount: getTotalEndingsCountFn,
      }}
    >
      {children}
    </SaveContext.Provider>
  );
}

export function useSave(): SaveContextType {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error('useSave must be used within a SaveProvider');
  }
  return context;
}
