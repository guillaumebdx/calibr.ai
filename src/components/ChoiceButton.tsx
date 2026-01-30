import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View,
  Animated,
} from 'react-native';

interface ChoiceButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

export function ChoiceButton({ text, onPress, disabled = false }: ChoiceButtonProps) {
  const opacity = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(opacity, {
      toValue: 0.7,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={[styles.container, { opacity }]}>
        <View style={styles.glassEffect}>
          <Text style={styles.text}>{text}</Text>
        </View>
        <View style={styles.glowEffect} />
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
  glowEffect: {
    position: 'absolute',
    bottom: -2,
    left: '20%',
    right: '20%',
    height: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 2,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
});
