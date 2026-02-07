import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GradientBackground, TypewriterText } from '../src/components';
import { useSave } from '../src/context/SaveContext';
import { getGameOverById } from '../src/utils/i18nData';

export default function GameOverScreen() {
  const { t } = useTranslation();
  const { gameOverId } = useLocalSearchParams<{ gameOverId: string }>();
  const { confirmGameOver } = useSave();
  const [isComplete, setIsComplete] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const gameOver = gameOverId ? getGameOverById(gameOverId) : null;

  const handleComplete = () => {
    setIsComplete(true);
  };

  useEffect(() => {
    if (isComplete) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isComplete]);

  const handleConfirm = async () => {
    if (!gameOverId || isConfirmed) return;
    setIsConfirmed(true);
    await confirmGameOver(gameOverId);
    router.replace('/menu');
  };

  if (!gameOver) {
    return (
      <GradientBackground colors={['#1a0000', '#0d0d0d', '#1a0000']}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{t('gameover.errorNotFound')}</Text>
          <TouchableOpacity onPress={() => router.replace('/menu')}>
            <Text style={styles.buttonText}>{t('gameover.backToMenu')}</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground colors={['#1a0000', '#0d0d0d', '#1a0000']}>
      <View style={styles.container}>
        <Text style={styles.titleText}>{t('gameover.endingUnlocked')}</Text>
        <Text style={styles.endingTitle}>{gameOver.title}</Text>
        
        <View style={styles.textContainer}>
          <TypewriterText 
            text={gameOver.message} 
            speed={30}
            delay={1500}
            onComplete={handleComplete}
            style={styles.messageText}
          />
        </View>
        
        {isComplete && (
          <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
            <TouchableOpacity 
              style={[styles.confirmButton, isConfirmed && styles.confirmButtonDisabled]} 
              onPress={handleConfirm}
              disabled={isConfirmed}
            >
              <Text style={styles.buttonText}>
                {isConfirmed ? t('gameover.saving') : t('gameover.confirm')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  titleText: {
    fontSize: 12,
    color: '#ff4444',
    letterSpacing: 4,
    marginBottom: 8,
    fontWeight: '600',
  },
  endingTitle: {
    fontSize: 28,
    color: '#ff6666',
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  textContainer: {
    maxWidth: 340,
    minHeight: 300,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#cccccc',
  },
  confirmButton: {
    marginTop: 48,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ff4444',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    marginBottom: 24,
  },
});
