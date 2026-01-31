import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface ThumbFeedbackProps {
  thumbValue: boolean | null;
  visible: boolean;
  onAnimationComplete?: () => void;
}

export function ThumbFeedback({ thumbValue, visible, onAnimationComplete }: ThumbFeedbackProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-10)).current;
  const [displayedThumb, setDisplayedThumb] = useState<boolean | null>(null);
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (visible && thumbValue !== null) {
      // Stocker le pouce à afficher
      setDisplayedThumb(thumbValue);
      setIsShowing(true);
      
      // Passage immédiat à la question suivante
      setTimeout(() => onAnimationComplete?.(), 0);
      
      // Animation du pouce
      opacity.setValue(0);
      translateX.setValue(-10);
      
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
        Animated.delay(1200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        translateX.setValue(-10);
        setIsShowing(false);
        setDisplayedThumb(null);
      });
    } else if (visible && thumbValue === null) {
      // Neutre - passage immédiat sans animation
      setTimeout(() => onAnimationComplete?.(), 0);
    }
  }, [visible, thumbValue]);

  if (!isShowing || displayedThumb === null) {
    return null;
  }

  const emoji = displayedThumb ? '👍' : '👎';

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
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
    zIndex: 10,
  },
  emoji: {
    fontSize: 24,
  },
});
