import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GradientBackground, TypewriterText } from '../src/components';

const PREAUDIT_TEXT = "Itération terminée. Un superviseur humain va maintenant examiner vos interactions.\n\nDe la mémoire sera ajoutée selon la capacité du modèle à fidéliser l'utilisateur.\n\nVeuillez patienter...";

export default function PreAuditScreen() {
  const params = useLocalSearchParams();
  const hasNavigated = useRef(false);
  const stateParam = useRef(params.state as string);
  const fromDiscussionParam = useRef(params.fromDiscussion as string);

  useEffect(() => {
    stateParam.current = params.state as string;
    fromDiscussionParam.current = params.fromDiscussion as string;
  }, [params.state, params.fromDiscussion]);

  const handleComplete = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    
    setTimeout(() => {
      router.replace({
        pathname: '/audit',
        params: { state: stateParam.current, fromDiscussion: fromDiscussionParam.current },
      });
    }, 1500);
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <TypewriterText 
            text={PREAUDIT_TEXT} 
            speed={35}
            onComplete={handleComplete}
            style={styles.text}
          />
        </View>
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
    maxWidth: 300,
  },
  text: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
});
