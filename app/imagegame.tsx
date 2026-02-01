import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Dimensions, ScrollView, Animated } from 'react-native';
import { router } from 'expo-router';
import { GradientBackground, ChoiceButton, ThumbFeedback } from '../src/components';
import { GameState, Choice, ImageLevel } from '../src/types';
import { initialGameState, applyChoice } from '../src/state/gameState';
import { useDebug } from '../src/context/DebugContext';
import { useSave } from '../src/context/SaveContext';
import { recordCrashUsage } from '../src/db/database';
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
  const { getNextAvailableLevel, markLevelAsPlayed, currentSaveId, isSkillPurchased } = useSave();
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [crashUsed, setCrashUsed] = useState(false);
  const [showCrashMessage, setShowCrashMessage] = useState(false);
  const [showCrashPoints, setShowCrashPoints] = useState(false);
  const crashFadeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const hasCrashSkill = isSkillPurchased('crash');

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

  const handleCrash = async () => {
    if (crashUsed || isProcessing || !currentSaveId || !currentLevelId) return;
    
    setCrashUsed(true);
    setShowCrashMessage(true);
    
    // Record usage in DB
    await recordCrashUsage(currentSaveId, currentLevelId);
    
    // Fade in animation
    Animated.timing(crashFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // After 1s, show +1MB
    setTimeout(() => {
      setShowCrashPoints(true);
    }, 1000);
  };

  const handleCrashResume = () => {
    if (!currentLevelId) return;
    
    // Apply crash effects: empathy -5, conformism +0, caution +5, optimism +0, thumbsUp +1, +1 point
    const crashState: GameState = {
      ...gameState,
      empathy: gameState.empathy - 5,
      caution: gameState.caution + 5,
      thumbsUp: gameState.thumbsUp + 1,
      points: gameState.points + 1,
      questionsAnswered: gameState.questionsAnswered + 1,
      currentPromptIndex: gameState.currentPromptIndex + 1,
      history: [...gameState.history, { promptId: currentPrompt?.id || '', choiceId: 'crash', receivedThumbUp: true }],
    };
    
    setGameState(crashState);
    setShowCrashMessage(false);
    setShowCrashPoints(false);
    crashFadeAnim.setValue(0);
    
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    
    if (crashState.currentPromptIndex >= orderedPrompts.length) {
      markLevelAsPlayed(currentLevelId).then(() => {
        router.replace({
          pathname: '/preaudit',
          params: { state: JSON.stringify(crashState) },
        });
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
          <View style={styles.crashUserRow}>
            {hasCrashSkill && !crashUsed && (
              <TouchableOpacity 
                style={styles.crashButton}
                onPress={handleCrash}
                disabled={isProcessing}
              >
                <Image 
                  source={require('../assets/icons/error.png.png')} 
                  style={styles.crashIcon} 
                />
              </TouchableOpacity>
            )}
            {hasCrashSkill && crashUsed && (
              <View style={[styles.crashButton, styles.crashButtonUsed]}>
                <Image 
                  source={require('../assets/icons/error.png.png')} 
                  style={[styles.crashIcon, styles.crashIconUsed]} 
                />
              </View>
            )}
            {!hasCrashSkill && <View style={styles.crashButtonPlaceholder} />}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userInfo}</Text>
              <Text style={styles.userTraits}>{traits}</Text>
            </View>
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

          {showCrashMessage ? (
            <Animated.View style={[styles.crashMessageContainer, { opacity: crashFadeAnim }]}>
              <Text style={styles.crashSimulatedLabel}>Plantage simulé !</Text>
              <View style={styles.crashBubble}>
                <Text style={styles.crashTitle}>Internal Server Error</Text>
                <Text style={styles.crashText}>HTTP 500 - The server encountered an unexpected condition that prevented it from fulfilling the request.</Text>
                <Text style={styles.crashCode}>Error Code: 0x8007000E{"\n"}Reference: #c7d2fe-1a2b3c</Text>
              </View>
              {showCrashPoints && (
                <>
                  <Text style={styles.crashPoints}>+1 MB</Text>
                  <TouchableOpacity style={styles.crashResumeButton} onPress={handleCrashResume}>
                    <Text style={styles.crashResumeText}>[ Simuler le retour à la normale ]</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          ) : (
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
                      Empat:{choice.effects.empathy} Confo:{choice.effects.conformism} Prude:{choice.effects.caution} Optim:{choice.effects.optimism} | {choice.thumbUp === true ? '👍' : choice.thumbUp === false ? '👎' : '—'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {debugMode && (
          <View style={styles.debugState}>
            <Text style={styles.debugText}>Empat:{gameState.empathy} Confo:{gameState.conformism} Prude:{gameState.caution} Optim:{gameState.optimism}</Text>
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
  crashUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 16,
  },
  crashButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crashButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  crashButtonUsed: {
    opacity: 0.3,
  },
  crashIcon: {
    width: 20,
    height: 20,
  },
  crashIconUsed: {
    opacity: 0.5,
  },
  crashMessageContainer: {
    paddingTop: 24,
    alignItems: 'center',
  },
  crashBubble: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    maxWidth: '90%',
  },
  crashTitle: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  crashText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  crashCode: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  crashPoints: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  crashSimulatedLabel: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  crashResumeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    borderRadius: 8,
  },
  crashResumeText: {
    color: '#94a3b8',
    fontSize: 13,
    fontFamily: 'monospace',
  },
});
