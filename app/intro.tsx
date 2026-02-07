import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GradientBackground, TypewriterText } from '../src/components';

export default function IntroScreen() {
  const { t } = useTranslation();
  const [isComplete, setIsComplete] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;

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

  const handleContinue = () => {
    router.replace('/discussion');
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <TypewriterText 
            text={t('intro.text')} 
            speed={40}
            delay={2000}
            onComplete={handleComplete}
            style={styles.introText}
          />
        </View>
        
        {isComplete && (
          <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>{t('intro.start')}</Text>
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
  textContainer: {
    maxWidth: 320,
  },
  introText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 48,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#58a6ff',
    fontSize: 16,
  },
});
