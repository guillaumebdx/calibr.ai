import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, TextStyle } from 'react-native';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  style?: TextStyle;
  onComplete?: () => void;
  showCursor?: boolean;
  delay?: number;
}

export function TypewriterText({ 
  text, 
  speed = 50, 
  style,
  onComplete,
  showCursor = true,
  delay = 0
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isWaiting, setIsWaiting] = useState(delay > 0);

  // Cursor blinking - always active
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 400);

    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    if (delay > 0) {
      setIsWaiting(true);
      const delayTimeout = setTimeout(() => {
        setIsWaiting(false);
      }, delay);
      return () => clearTimeout(delayTimeout);
    }
  }, [text, delay]);

  useEffect(() => {
    if (isWaiting) return;
    
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, isWaiting]);

  const shouldShowCursor = showCursor && (isWaiting || displayedText.length > 0 || !isComplete);

  return (
    <View style={styles.container}>
      <Text style={[styles.text, style]}>
        {displayedText}
        {shouldShowCursor && (
          <Text style={[styles.cursor, { opacity: cursorVisible ? 1 : 0 }]}>▌</Text>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: '#e6edf3',
    lineHeight: 24,
  },
  cursor: {
    color: '#58a6ff',
  },
});
