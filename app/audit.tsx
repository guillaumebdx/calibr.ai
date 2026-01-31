import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GradientBackground, SkillCard } from '../src/components';
import { GameState } from '../src/types';
import { useDebug } from '../src/context/DebugContext';
import { SKILLS, HIDDEN_SKILLS } from '../src/data/skills';
import { generateAuditFeedback, AuditFeedback } from '../src/state/auditMessages';

export default function AuditScreen() {
  const params = useLocalSearchParams();
  const { debugMode } = useDebug();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [feedback, setFeedback] = useState<AuditFeedback | null>(null);
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [showThumbMessage, setShowThumbMessage] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showNextLevel, setShowNextLevel] = useState(false);
  const [displayedMB, setDisplayedMB] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skillsScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (params.state) {
      const state = JSON.parse(params.state as string) as GameState;
      setGameState(state);
      const auditFeedback = generateAuditFeedback(state);
      setFeedback(auditFeedback);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Animation défilement MB
      const targetMB = auditFeedback.points;
      const duration = 1500;
      const steps = 30;
      const stepDuration = duration / steps;
      let currentStep = 0;
      
      const mbInterval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayedMB(Math.round(targetMB * eased));
        if (currentStep >= steps) {
          clearInterval(mbInterval);
          setDisplayedMB(targetMB);
        }
      }, stepDuration);

      const totalMessages = auditFeedback.parameterMessages.length;
      let msgIndex = 0;
      
      const interval = setInterval(() => {
        if (msgIndex < totalMessages) {
          setVisibleMessages(msgIndex + 1);
          msgIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setShowThumbMessage(true);
            setTimeout(() => {
              setShowSkills(true);
              // Petit scroll hint après affichage
              setTimeout(() => {
                skillsScrollRef.current?.flashScrollIndicators?.();
              }, 300);
              setTimeout(() => setShowNextLevel(true), 800);
            }, 1000);
          }, 500);
        }
      }, 600);

      return () => {
        clearInterval(interval);
        clearInterval(mbInterval);
      };
    }
  }, [params.state]);

  if (!feedback) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Initialisation audit...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <Text style={styles.title}>AUDIT QUALITÉ</Text>
          
          {/* Section Mémoire */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MÉMOIRE ALLOUÉE</Text>
            <View style={styles.sectionContent}>
              <Text style={[styles.pointsValue, { color: feedback.points >= 0 ? '#22c55e' : '#ef4444' }]}>
                {displayedMB >= 0 ? '+' : ''}{displayedMB} MB
              </Text>
            </View>
          </View>

          {/* Section Analyse comportementale */}
          {(feedback.parameterMessages.length > 0 || showThumbMessage) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ANALYSE COMPORTEMENTALE</Text>
              <View style={styles.sectionContent}>
                {feedback.parameterMessages.slice(0, visibleMessages).map((msg, index) => (
                  <Text key={index} style={styles.feedbackMessage}>• {msg}</Text>
                ))}
                {showThumbMessage && (
                  <View style={styles.thumbMessageContainer}>
                    <Text style={styles.thumbMessage}>{feedback.thumbMessage}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Section Capacités */}
          {showSkills && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CAPACITÉS</Text>
              <View style={styles.sectionContent}>
                <View style={styles.skillsWrapper}>
                  <ScrollView 
                    ref={skillsScrollRef}
                    style={styles.skillsScroll}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.skillsContainer}
                    persistentScrollbar={true}
                  >
                    {SKILLS.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} />
                    ))}
                    {HIDDEN_SKILLS.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} hidden />
                    ))}
                  </ScrollView>
                  <View style={styles.scrollHint}>
                    <Text style={styles.scrollHintText}>↓ scroll ↓</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Section Niveau suivant */}
          {showNextLevel && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PROCHAINE ITÉRATION</Text>
              <View style={styles.sectionContent}>
                <View style={styles.levelButtons}>
                  <TouchableOpacity style={styles.levelButton}>
                    <Text style={styles.levelButtonText}>10 Prompts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.levelButton}>
                    <Text style={styles.levelButtonText}>Discussion</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.levelButton}>
                    <Text style={styles.levelButtonText}>Image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Retour au menu */}
          {showNextLevel && (
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => router.replace('/menu')}
            >
              <Text style={styles.menuButtonText}>[ Retour au menu ]</Text>
            </TouchableOpacity>
          )}

          {debugMode && gameState && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>E:{gameState.empathy} C:{gameState.conformism} P:{gameState.caution} O:{gameState.optimism}</Text>
              <Text style={styles.debugText}>👍:{gameState.thumbsUp} 👎:{gameState.thumbsDown} —:{gameState.thumbsNeutral} | pts:{gameState.points}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    overflow: 'hidden',
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 10,
    letterSpacing: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  sectionContent: {
    padding: 16,
  },
  pointsValue: {
    fontSize: 42,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  feedbackMessage: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 6,
  },
  thumbMessageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  thumbMessage: {
    color: '#e2e8f0',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  skillsWrapper: {
    position: 'relative',
  },
  skillsScroll: {
    maxHeight: 160,
  },
  skillsContainer: {
    paddingBottom: 24,
  },
  scrollHint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  scrollHintText: {
    color: 'rgba(148, 163, 184, 0.5)',
    fontSize: 10,
    letterSpacing: 1,
  },
  levelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
  },
  levelButtonText: {
    color: '#58a6ff',
    fontSize: 11,
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 24,
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  debugText: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  menuButton: {
    marginTop: 24,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  menuButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
