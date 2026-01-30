import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { GradientBackground, ChoiceButton, ThumbFeedback } from '../src/components';
import { GameState, Choice, Level } from '../src/types';
import { initialGameState, applyChoice } from '../src/state/gameState';
import { useDebug } from '../src/context/DebugContext';
import levelData from '../src/data/level1.json';

export default function GameScreen() {
  const { debugMode } = useDebug();
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const level = levelData as Level;

  const orderedPrompts = useMemo(() => {
    if (level.prompts.length !== 10) return level.prompts;
    const arr = [...level.prompts];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [level.prompts]);

  const currentPrompt = orderedPrompts[gameState.currentPromptIndex];
  const progress = `${gameState.currentPromptIndex + 1}/${level.prompts.length}`;

  const handleChoice = (choice: Choice) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setLastChoice(choice);
    setShowFeedback(true);
  };

  const handleFeedbackComplete = () => {
    if (!lastChoice || !currentPrompt) return;
    
    const newState = applyChoice(gameState, lastChoice, currentPrompt.id);
    setGameState(newState);
    setShowFeedback(false);
    setLastChoice(null);
    setIsProcessing(false);

    if (newState.currentPromptIndex >= orderedPrompts.length) {
      router.replace({
        pathname: '/preaudit',
        params: { state: JSON.stringify(newState) },
      });
    }
  };

  if (!currentPrompt) {
    return null;
  }

  const userInfo = `${currentPrompt.user.name}, ${currentPrompt.user.age} ans`;
  const traits = currentPrompt.user.traits.join(' · ');

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.progress}>{progress}</Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{userInfo}</Text>
            <ThumbFeedback
              thumbValue={lastChoice?.thumbUp ?? null}
              visible={showFeedback}
              onAnimationComplete={handleFeedbackComplete}
            />
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'flex-end',
  },
  progress: {
    color: 'rgba(148, 163, 184, 0.6)',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  userInfo: {
    marginTop: 24,
    marginBottom: 32,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '500',
  },
  userTraits: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  promptText: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 32,
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
