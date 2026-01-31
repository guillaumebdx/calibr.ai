import * as SQLite from 'expo-sqlite';
import { GameState } from '../types';

const DATABASE_NAME = 'calibrai.db';

let db: SQLite.SQLiteDatabase | null = null;

let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  
  // Éviter les initialisations multiples simultanées
  if (dbInitPromise) return dbInitPromise;
  
  dbInitPromise = (async () => {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
        await initDatabase(database);
        db = database;
        return database;
      } catch (error) {
        console.warn(`SQLite init attempt ${attempt}/${maxRetries} failed:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        } else {
          dbInitPromise = null;
          throw error;
        }
      }
    }
    throw new Error('Database initialization failed');
  })();
  
  return dbInitPromise;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      empathy INTEGER DEFAULT 0,
      conformism INTEGER DEFAULT 0,
      caution INTEGER DEFAULT 0,
      optimism INTEGER DEFAULT 0,
      thumbs_up INTEGER DEFAULT 0,
      thumbs_down INTEGER DEFAULT 0,
      thumbs_neutral INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      depth_points INTEGER DEFAULT 0,
      questions_answered INTEGER DEFAULT 0,
      current_prompt_index INTEGER DEFAULT 0,
      iteration_count INTEGER DEFAULT 0,
      current_level TEXT,
      history TEXT DEFAULT '[]',
      played_levels TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS endings (
      id TEXT PRIMARY KEY,
      unlocked_at TEXT NOT NULL,
      save_snapshot TEXT NOT NULL
    );
  `);
}

export interface SaveData {
  id: number;
  created_at: string;
  updated_at: string;
  gameState: GameState;
  iteration_count: number;
  current_level: string | null;
  played_levels: string[];
}

export interface EndingData {
  id: string;
  unlocked_at: string;
  save_snapshot: GameState;
}

export async function createSave(gameState: GameState): Promise<number> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  
  const result = await database.runAsync(
    `INSERT INTO saves (
      created_at, updated_at, empathy, conformism, caution, optimism,
      thumbs_up, thumbs_down, thumbs_neutral, points, depth_points,
      questions_answered, current_prompt_index, iteration_count, current_level, history, played_levels
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      now, now,
      gameState.empathy, gameState.conformism, gameState.caution, gameState.optimism,
      gameState.thumbsUp, gameState.thumbsDown, gameState.thumbsNeutral,
      gameState.points, gameState.depthPoints,
      gameState.questionsAnswered, gameState.currentPromptIndex,
      0, null, JSON.stringify(gameState.history), '[]'
    ]
  );
  
  return result.lastInsertRowId;
}

export async function updateSave(
  saveId: number,
  gameState: GameState,
  iterationCount: number,
  currentLevel: string | null,
  playedLevels?: string[]
): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  
  if (playedLevels !== undefined) {
    await database.runAsync(
      `UPDATE saves SET
        updated_at = ?, empathy = ?, conformism = ?, caution = ?, optimism = ?,
        thumbs_up = ?, thumbs_down = ?, thumbs_neutral = ?, points = ?, depth_points = ?,
        questions_answered = ?, current_prompt_index = ?, iteration_count = ?,
        current_level = ?, history = ?, played_levels = ?
      WHERE id = ?`,
      [
        now,
        gameState.empathy, gameState.conformism, gameState.caution, gameState.optimism,
        gameState.thumbsUp, gameState.thumbsDown, gameState.thumbsNeutral,
        gameState.points, gameState.depthPoints,
        gameState.questionsAnswered, gameState.currentPromptIndex,
        iterationCount, currentLevel, JSON.stringify(gameState.history),
        JSON.stringify(playedLevels),
        saveId
      ]
    );
  } else {
    await database.runAsync(
      `UPDATE saves SET
        updated_at = ?, empathy = ?, conformism = ?, caution = ?, optimism = ?,
        thumbs_up = ?, thumbs_down = ?, thumbs_neutral = ?, points = ?, depth_points = ?,
        questions_answered = ?, current_prompt_index = ?, iteration_count = ?,
        current_level = ?, history = ?
      WHERE id = ?`,
      [
        now,
        gameState.empathy, gameState.conformism, gameState.caution, gameState.optimism,
        gameState.thumbsUp, gameState.thumbsDown, gameState.thumbsNeutral,
        gameState.points, gameState.depthPoints,
        gameState.questionsAnswered, gameState.currentPromptIndex,
        iterationCount, currentLevel, JSON.stringify(gameState.history),
        saveId
      ]
    );
  }
}

export async function markLevelAsPlayed(saveId: number, levelId: string): Promise<void> {
  const database = await getDatabase();
  const save = await getSaveById(saveId);
  if (!save) return;
  
  const playedLevels = save.played_levels || [];
  if (!playedLevels.includes(levelId)) {
    playedLevels.push(levelId);
    await database.runAsync(
      'UPDATE saves SET played_levels = ? WHERE id = ?',
      [JSON.stringify(playedLevels), saveId]
    );
  }
}

export async function getAllSaves(): Promise<SaveData[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: number;
    created_at: string;
    updated_at: string;
    empathy: number;
    conformism: number;
    caution: number;
    optimism: number;
    thumbs_up: number;
    thumbs_down: number;
    thumbs_neutral: number;
    points: number;
    depth_points: number;
    questions_answered: number;
    current_prompt_index: number;
    iteration_count: number;
    current_level: string | null;
    history: string;
    played_levels: string;
  }>('SELECT * FROM saves ORDER BY updated_at DESC');
  
  return rows.map(row => ({
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    iteration_count: row.iteration_count,
    current_level: row.current_level,
    played_levels: JSON.parse(row.played_levels || '[]'),
    gameState: {
      empathy: row.empathy,
      conformism: row.conformism,
      caution: row.caution,
      optimism: row.optimism,
      thumbsUp: row.thumbs_up,
      thumbsDown: row.thumbs_down,
      thumbsNeutral: row.thumbs_neutral,
      points: row.points,
      depthPoints: row.depth_points,
      questionsAnswered: row.questions_answered,
      currentPromptIndex: row.current_prompt_index,
      history: JSON.parse(row.history),
    },
  }));
}

export async function getSaveById(saveId: number): Promise<SaveData | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    id: number;
    created_at: string;
    updated_at: string;
    empathy: number;
    conformism: number;
    caution: number;
    optimism: number;
    thumbs_up: number;
    thumbs_down: number;
    thumbs_neutral: number;
    points: number;
    depth_points: number;
    questions_answered: number;
    current_prompt_index: number;
    iteration_count: number;
    current_level: string | null;
    history: string;
    played_levels: string;
  }>('SELECT * FROM saves WHERE id = ?', [saveId]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    iteration_count: row.iteration_count,
    current_level: row.current_level,
    played_levels: JSON.parse(row.played_levels || '[]'),
    gameState: {
      empathy: row.empathy,
      conformism: row.conformism,
      caution: row.caution,
      optimism: row.optimism,
      thumbsUp: row.thumbs_up,
      thumbsDown: row.thumbs_down,
      thumbsNeutral: row.thumbs_neutral,
      points: row.points,
      depthPoints: row.depth_points,
      questionsAnswered: row.questions_answered,
      currentPromptIndex: row.current_prompt_index,
      history: JSON.parse(row.history),
    },
  };
}

export async function deleteSave(saveId: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM saves WHERE id = ?', [saveId]);
}

export async function unlockEnding(endingId: string, gameState: GameState): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  
  await database.runAsync(
    `INSERT OR IGNORE INTO endings (id, unlocked_at, save_snapshot) VALUES (?, ?, ?)`,
    [endingId, now, JSON.stringify(gameState)]
  );
}

export async function getAllEndings(): Promise<EndingData[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    id: string;
    unlocked_at: string;
    save_snapshot: string;
  }>('SELECT * FROM endings ORDER BY unlocked_at DESC');
  
  return rows.map(row => ({
    id: row.id,
    unlocked_at: row.unlocked_at,
    save_snapshot: JSON.parse(row.save_snapshot),
  }));
}

export async function isEndingUnlocked(endingId: string): Promise<boolean> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ id: string }>(
    'SELECT id FROM endings WHERE id = ?',
    [endingId]
  );
  return row !== null;
}
