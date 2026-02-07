import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GradientBackground, TypewriterText } from '../src/components';
import { useSave } from '../src/context/SaveContext';
import { shouldShowTwitterFeed } from '../src/utils/twitterSelector';

export default function PreAuditScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { currentSave } = useSave();
  const hasNavigated = useRef(false);
  const stateParam = useRef(params.state as string);
  const fromDiscussionParam = useRef(params.fromDiscussion as string);
  
  // Déterminer si on doit afficher Twitter (toutes les 2 itérations)
  const iterationCount = currentSave?.iteration_count ?? 0;
  const showTwitter = shouldShowTwitterFeed(iterationCount + 1); // +1 car l'itération actuelle n'est pas encore comptée

  useEffect(() => {
    stateParam.current = params.state as string;
    fromDiscussionParam.current = params.fromDiscussion as string;
  }, [params.state, params.fromDiscussion]);

  const handleComplete = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    
    setTimeout(() => {
      if (showTwitter) {
        router.replace({
          pathname: '/twitterfeed',
          params: { state: stateParam.current, fromDiscussion: fromDiscussionParam.current },
        });
      } else {
        router.replace({
          pathname: '/audit',
          params: { state: stateParam.current, fromDiscussion: fromDiscussionParam.current },
        });
      }
    }, 1500);
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <TypewriterText 
            text={showTwitter ? t('preaudit.twitterText') : t('preaudit.text')} 
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
