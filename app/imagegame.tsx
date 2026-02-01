import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Dimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { GradientBackground, ChoiceButton, ThumbFeedback } from '../src/components';
import { GameState, Choice, ImageLevel } from '../src/types';
import { initialGameState, applyChoice } from '../src/state/gameState';
import { useDebug } from '../src/context/DebugContext';
import { useSave } from '../src/context/SaveContext';
import image1Data from '../src/data/image1.json';
import image2Data from '../src/data/image2.json';

const IMAGE_LEVELS: Record<string, ImageLevel> = {
  image1: image1Data as ImageLevel,
  image2: image2Data as ImageLevel,
};

const IMAGES: Record<string, any> = {
  'antivirus.png': require('../assets/input_image/antivirus.png'),
  'car1.png': require('../assets/input_image/car1.png'),
  'exercise.png': require('../assets/input_image/exercise.png'),
  'plant.png': require('../assets/input_image/plant.png'),
  'man1.png': require('../assets/input_image/man1.png'),
  'button.png': require('../assets/input_image/button.png'),
  'outfit.png': require('../assets/input_image/outfit.png'),
  'contrail.png': require('../assets/input_image/contrail.png'),
  'diamond.png': require('../assets/input_image/diamond.png'),
  'car2.png': require('../assets/input_image/car2.png'),
  'wire.png': require('../assets/input_image/wire.png'),
  'clock.png': require('../assets/input_image/clock.png'),
  'blur.png': require('../assets/input_image/blur.png'),
  'alcool.png': require('../assets/input_image/alcool.png'),
  'plaques.png': require('../assets/input_image/plaques.png'),
  'captcha.png': require('../assets/input_image/captcha.png'),
  'airport.png': require('../assets/input_image/airport.png'),
  'menu.png': require('../assets/input_image/menu.png'),
  'money.png': require('../assets/input_image/money.png'),
  'nike.png': require('../assets/input_image/nike.png'),
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageGameScreen() {
  const { debugMode } = useDebug();
  const { getNextAvailableLevel, markLevelAsPlayed } = useSave();
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const nextLevel = getNextAvailableLevel('image');
    setCurrentLevelId(nextLevel);
  }, [getNextAvailableLevel]);

  const level = currentLevelId ? IMAGE_LEVELS[currentLevelId] : null;

  const orderedPrompts = useMemo(() => {
    if (!level) return [];
    const shuffle = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    // Shuffle prompts
    const shuffledPrompts = level.prompts.length === 10 ? shuffle(level.prompts) : level.prompts;
    // Shuffle choices for each prompt
    return shuffledPrompts.map(prompt => ({
      ...prompt,
      choices: shuffle(prompt.choices)
    }));
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
    
    // Scroll to top for next question
    scrollRef.current?.scrollTo({ y: 0, animated: false });

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
          <Text style={{ color: '#9ca3af', fontSize: 16 }}>Aucun niveau image disponible</Text>
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
  const imageSource = IMAGES[currentPrompt.image];

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

        <ScrollView 
          ref={scrollRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo}</Text>
            <Text style={styles.userTraits}>{traits}</Text>
          </View>

          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>{currentPrompt.text}</Text>
          </View>

          {imageSource && (
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => setImageModalVisible(true)}
              activeOpacity={0.9}
            >
              <Image 
                source={imageSource} 
                style={styles.promptImage}
                resizeMode="contain"
              />
              <Text style={styles.imageHint}>Appuyez pour agrandir</Text>
            </TouchableOpacity>
          )}

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
        </ScrollView>

        {debugMode && (
          <View style={styles.debugState}>
            <Text style={styles.debugText}>E:{gameState.empathy} C:{gameState.conformism} P:{gameState.caution} O:{gameState.optimism}</Text>
            <Text style={styles.debugText}>👍:{gameState.thumbsUp} 👎:{gameState.thumbsDown} —:{gameState.thumbsNeutral}</Text>
          </View>
        )}

        {/* Modal plein écran pour l'image */}
        <Modal
          visible={imageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              {imageSource && (
                <Image 
                  source={imageSource} 
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  userInfo: {
    marginTop: 20,
    marginBottom: 16,
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
    paddingVertical: 12,
    paddingRight: 40,
  },
  promptText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
    lineHeight: 24,
  },
  imageContainer: {
    marginVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  promptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  imageHint: {
    color: 'rgba(148, 163, 184, 0.6)',
    fontSize: 11,
    marginTop: 8,
  },
  choicesContainer: {
    paddingTop: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 120,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});
