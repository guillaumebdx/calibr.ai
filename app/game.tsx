import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { GradientBackground, ChoiceButton, ThumbFeedback } from '../src/components';
import { GameState, Choice, Level } from '../src/types';
import { initialGameState, applyChoice } from '../src/state/gameState';
import { useDebug } from '../src/context/DebugContext';
import { useSave } from '../src/context/SaveContext';
import level1Data from '../src/data/level1.json';
import level2Data from '../src/data/level2.json';

const LEVELS: Record<string, Level> = {
  level1: level1Data as Level,
  level2: level2Data as Level,
};

export default function GameScreen() {
  const { debugMode } = useDebug();
  const { getNextAvailableLevel, markLevelAsPlayed, currentSave } = useSave();
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);

  useEffect(() => {
    const nextLevel = getNextAvailableLevel('prompts');
    setCurrentLevelId(nextLevel);
  }, [getNextAvailableLevel]);

  const level = currentLevelId ? LEVELS[currentLevelId] : null;

  const orderedPrompts = useMemo(() => {
    if (!level) return [];
    if (level.prompts.length !== 10) return level.prompts;
    const arr = [...level.prompts];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [level]);

  const currentPrompt = orderedPrompts[gameState.currentPromptIndex];
  const progress = level ? `${gameState.currentPromptIndex + 1}/${level.prompts.length}` : '';

  const handleChoice = (choice: Choice) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setLastChoice(choice);
    setShowFeedback(true);
  };

  const handleFeedbackComplete = async () => {
    if (!lastChoice || !currentPrompt || !currentLevelId) return;
    
    const newState = applyChoice(gameState, lastChoice, currentPrompt.id);
    setGameState(newState);
    setShowFeedback(false);
    setLastChoice(null);
    setIsProcessing(false);

    if (newState.currentPromptIndex >= orderedPrompts.length) {
      await markLevelAsPlayed(currentLevelId);
      router.replace({
        pathname: '/preaudit',
        params: { state: JSON.stringify(newState) },
      });
    }
  };

  if (!level || !currentPrompt) {
    return (
      <GradientBackground colors={['#212121', '#212121', '#212121']}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#9ca3af', fontSize: 16 }}>Aucun niveau disponible</Text>
          <TouchableOpacity 
            style={{ marginTop: 20, padding: 12 }}
            onPress={() => router.replace('/menu')}
          >
            <Text style={{ color: '#58a6ff', fontSize: 14 }}>Retour au menu</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  const userInfo = `${currentPrompt.user.name}, ${currentPrompt.user.age} ans`;
  const traits = currentPrompt.user.traits.join(' · ');

  return (
    <GradientBackground colors={['#212121', '#212121', '#212121']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.progress}>{progress}</Text>
          <ThumbFeedback
            thumbValue={lastChoice?.thumbUp ?? null}
            visible={showFeedback}
            onAnimationComplete={handleFeedbackComplete}
          />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userInfo}</Text>
          <Text style={styles.userTraits}>{traits}</Text>
        </View>

        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>{currentPrompt.text}</Text>
        </View>

        <View style={styles.choicesContainer}>
          {currentPrompt.choices.map((choice) => (
            <View key={choice.id}>
              <ChoiceButton
                text={choice.text}
                onPress={() => handleChoice(choice)}
                disabled={isProcessing}
              />
              {debugMode && (
                <Text style={styles.debugEffects}>
                  E:{choice.effects.empathy} C:{choice.effects.conformism} P:{choice.effects.caution} O:{choice.effects.optimism} | {choice.thumbUp === true ? '👍' : choice.thumbUp === false ? '👎' : '—'}
                </Text>
              )}
            </View>
          ))}
        </View>

        {debugMode && (
          <View style={styles.debugState}>
            <Text style={styles.debugText}>E:{gameState.empathy} C:{gameState.conformism} P:{gameState.caution} O:{gameState.optimism}</Text>
            <Text style={styles.debugText}>👍:{gameState.thumbsUp} 👎:{gameState.thumbsDown} —:{gameState.thumbsNeutral}</Text>
          </View>
        )}

      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progress: {
    color: '#9ca3af',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  userInfo: {
    marginTop: 20,
    marginBottom: 24,
    alignSelf: 'flex-end',
    backgroundColor: '#2f2f2f',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '85%',
  },
  userName: {
    color: '#e5e5e5',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  userTraits: {
    color: '#9ca3af',
    fontSize: 12,
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: 16,
    paddingRight: 40,
  },
  promptText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
    lineHeight: 24,
  },
  choicesContainer: {
    paddingTop: 24,
  },
  debugEffects: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  debugState: {
    position: 'absolute',
    bottom: 8,
    left: 24,
    right: 24,
  },
  debugText: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
