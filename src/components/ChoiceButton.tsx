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
    outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.25)'],
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
            colors={['transparent', 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
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
    backgroundColor: '#2f2f2f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  text: {
    color: '#e5e5e5',
    fontSize: 15,
    textAlign: 'left',
    fontWeight: '400',
    lineHeight: 22,
  },
  glowContainer: {
    position: 'absolute',
    bottom: -4,
    left: '10%',
    right: '10%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    height: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
