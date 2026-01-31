import React, { useRef } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ChoiceButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

export function ChoiceButton({ text, onPress, disabled = false }: ChoiceButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(56, 189, 248, 0.2)', 'rgba(56, 189, 248, 0.6)'],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={[styles.glassEffect, { borderColor }]}>
          <Text style={styles.text}>{text}</Text>
        </Animated.View>
        <View style={styles.glowContainer}>
          <LinearGradient
            colors={['transparent', 'rgba(56, 189, 248, 0.15)', 'rgba(56, 189, 248, 0.3)', 'rgba(56, 189, 248, 0.15)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.glowGradient}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    position: 'relative',
  },
  glassEffect: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  text: {
    color: '#e2e8f0',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '400',
  },
  glowContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    height: 1,
  },
});
