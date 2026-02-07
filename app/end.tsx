import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GradientBackground, TypewriterText } from '../src/components';

export default function EndScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const [showRestart, setShowRestart] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const reason = (params.reason as string) || t('end.agentDisabled');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleComplete = () => {
    setTimeout(() => setShowRestart(true), 500);
  };

  const handleRestart = () => {
    router.replace('/');
  };

  return (
    <GradientBackground colors={['#0a0a0f', '#1a0a0a', '#0a0a0f']}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>STATUS</Text>
          <Text style={styles.statusValue}>TERMINATED</Text>
        </View>

        <View style={styles.reasonContainer}>
          <TypewriterText
            text={reason}
            speed={35}
            onComplete={handleComplete}
            style={styles.reasonText}
            showCursor={false}
          />
        </View>

        {showRestart && (
          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartText}>{t('end.backToMenu')}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  statusLabel: {
    color: '#64748b',
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 8,
  },
  statusValue: {
    color: '#ef4444',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 6,
  },
  reasonContainer: {
    maxWidth: 300,
  },
  reasonText: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  restartButton: {
    marginTop: 64,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  restartText: {
    color: '#475569',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
