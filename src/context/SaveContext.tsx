import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameState } from '../types';
import { 
  SaveData, 
  createSave, 
  updateSave, 
  getSaveById, 
  getAllSaves,
  deleteSave as dbDeleteSave,
  markLevelAsPlayed as dbMarkLevelAsPlayed
} from '../db/database';
import { initialGameState } from '../state/gameState';

interface SaveContextType {
  currentSaveId: number | null;
  currentSave: SaveData | null;
  saves: SaveData[];
  isLoading: boolean;
  
  loadSaves: () => Promise<void>;
  startNewGame: () => Promise<number>;
  loadSave: (saveId: number) => Promise<SaveData | null>;
  saveProgress: (gameState: GameState, currentLevel: string | null) => Promise<void>;
  markLevelAsPlayed: (levelId: string) => Promise<void>;
  deleteSave: (saveId: number) => Promise<void>;
  clearCurrentSave: () => void;
  isLevelPlayed: (levelId: string) => boolean;
  getNextAvailableLevel: (levelType: 'prompts' | 'discussion') => string | null;
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

export function SaveProvider({ children }: { children: ReactNode }) {
  const [currentSaveId, setCurrentSaveId] = useState<number | null>(null);
  const [currentSave, setCurrentSave] = useState<SaveData | null>(null);
  const [saves, setSaves] = useState<SaveData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    await loadSaves();
    return saveId;
  }, [loadSaves]);

  const loadSave = useCallback(async (saveId: number): Promise<SaveData | null> => {
    const save = await getSaveById(saveId);
    if (save) {
      setCurrentSaveId(saveId);
      setCurrentSave(save);
    }
    return save;
  }, []);

  const saveProgress = useCallback(async (
    gameState: GameState,
    currentLevel: string | null
  ): Promise<void> => {
    if (!currentSaveId || !currentSave) return;
    
    const newIterationCount = currentSave.iteration_count + 1;
    await updateSave(currentSaveId, gameState, newIterationCount, currentLevel);
    
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

  const getNextAvailableLevel = useCallback((levelType: 'prompts' | 'discussion'): string | null => {
    const playedLevels = currentSave?.played_levels ?? [];
    
    if (levelType === 'prompts') {
      const promptLevels = ['level1', 'level2'];
      return promptLevels.find(l => !playedLevels.includes(l)) ?? null;
    } else {
      const discussionLevels = ['discussion1', 'discussion2'];
      return discussionLevels.find(l => !playedLevels.includes(l)) ?? null;
    }
  }, [currentSave]);

  return (
    <SaveContext.Provider
      value={{
        currentSaveId,
        currentSave,
        saves,
        isLoading,
        loadSaves,
        startNewGame,
        loadSave,
        saveProgress,
        markLevelAsPlayed,
        deleteSave,
        clearCurrentSave,
        isLevelPlayed,
        getNextAvailableLevel,
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
