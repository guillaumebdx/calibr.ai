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
  spendPoints as dbSpendPoints
} from '../db/database';
import { initialGameState } from '../state/gameState';

interface SaveContextType {
  currentSaveId: number | null;
  currentSave: SaveData | null;
  saves: SaveData[];
  isLoading: boolean;
  purchasedSkills: string[];
  
  loadSaves: () => Promise<void>;
  startNewGame: () => Promise<number>;
  loadSave: (saveId: number) => Promise<SaveData | null>;
  saveProgress: (gameState: GameState, currentLevel: string | null) => Promise<void>;
  markLevelAsPlayed: (levelId: string) => Promise<void>;
  deleteSave: (saveId: number) => Promise<void>;
  clearCurrentSave: () => void;
  isLevelPlayed: (levelId: string) => boolean;
  getNextAvailableLevel: (levelType: 'prompts' | 'discussion' | 'image') => string | null;
  isSkillPurchased: (skillId: string) => boolean;
  buySkill: (skillId: string, price: number) => Promise<boolean>;
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

export function SaveProvider({ children }: { children: ReactNode }) {
  const [currentSaveId, setCurrentSaveId] = useState<number | null>(null);
  const [currentSave, setCurrentSave] = useState<SaveData | null>(null);
  const [saves, setSaves] = useState<SaveData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [purchasedSkills, setPurchasedSkills] = useState<string[]>([]);

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
  ): Promise<void> => {
    if (!currentSaveId || !currentSave) return;
    
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
    await updateSave(currentSaveId, cumulativeGameState, newIterationCount, currentLevel);
    
    const updatedSave = await getSaveById(currentSaveId);
    setCurrentSave(updatedSave);
    await loadSaves();
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
      const promptLevels = ['level1', 'level2', 'level3', 'level4'];
      return promptLevels.find(l => !playedLevels.includes(l)) ?? null;
    } else if (levelType === 'discussion') {
      const discussionLevels = ['discussion1', 'discussion2', 'discussion3'];
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

  return (
    <SaveContext.Provider
      value={{
        currentSaveId,
        currentSave,
        saves,
        isLoading,
        purchasedSkills,
        loadSaves,
        startNewGame,
        loadSave,
        saveProgress,
        markLevelAsPlayed,
        deleteSave,
        clearCurrentSave,
        isLevelPlayed,
        getNextAvailableLevel,
        isSkillPurchased,
        buySkill,
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
