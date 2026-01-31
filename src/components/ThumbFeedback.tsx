import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface ThumbFeedbackProps {
  thumbValue: boolean | null;
  visible: boolean;
  onAnimationComplete?: () => void;
}

export function ThumbFeedback({ thumbValue, visible, onAnimationComplete }: ThumbFeedbackProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    if (visible) {
      // Passage immédiat à la question suivante
      onAnimationComplete?.();
      
      // Animation du pouce en parallèle (non bloquante)
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        translateX.setValue(-10);
      });
    }
  }, [visible]);

  if (!visible || thumbValue === null) {
    if (visible && thumbValue === null) {
      onAnimationComplete?.();
    }
    return null;
  }

  const emoji = thumbValue ? '👍' : '👎';

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity,
          transform: [{ translateX }],
        }
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 8,
  },
  emoji: {
    fontSize: 14,
  },
});
