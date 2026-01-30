import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../src/components';
import { useDebug } from '../src/context/DebugContext';

const DEBUG_TAP_COUNT = 8;
const DEBUG_TAP_TIMEOUT = 3000;

export default function MenuScreen() {
  const { debugMode, setDebugMode } = useDebug();
  const [tapCount, setTapCount] = useState(0);
  const lastTapTime = useRef<number>(0);

  const handleTitlePress = () => {
    const now = Date.now();
    
    if (now - lastTapTime.current > DEBUG_TAP_TIMEOUT) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      
      if (newCount >= DEBUG_TAP_COUNT) {
        setDebugMode(!debugMode);
        setTapCount(0);
      }
    }
    
    lastTapTime.current = now;
  };

  const handleStart = () => {
    router.push('/intro');
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <TouchableOpacity onPress={handleTitlePress} activeOpacity={1}>
          <Text style={styles.title}>calibr.ai</Text>
        </TouchableOpacity>
        
        {debugMode && (
          <Text style={styles.debugIndicator}>DEBUG MODE</Text>
        )}

        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startText}>[ Démarrer ]</Text>
        </TouchableOpacity>
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
  title: {
    color: '#e2e8f0',
    fontSize: 42,
    fontWeight: '200',
    letterSpacing: 2,
  },
  debugIndicator: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 8,
    letterSpacing: 2,
  },
  startButton: {
    marginTop: 80,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  startText: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
