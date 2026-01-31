import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GradientBackground, SkillCard } from '../src/components';
import { GameState } from '../src/types';
import { useDebug } from '../src/context/DebugContext';
import { useSave } from '../src/context/SaveContext';
import { SKILLS, HIDDEN_SKILLS } from '../src/data/skills';
import { generateAuditFeedback, AuditFeedback } from '../src/state/auditMessages';

export default function AuditScreen() {
  const params = useLocalSearchParams();
  const { debugMode } = useDebug();
  const { currentSave, saveProgress, getNextAvailableLevel } = useSave();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [cumulativePoints, setCumulativePoints] = useState(0);
  const [displayedCumulativeMB, setDisplayedCumulativeMB] = useState(0);
  const [feedback, setFeedback] = useState<AuditFeedback | null>(null);
  const [showNextLevel, setShowNextLevel] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [showThumbMessage, setShowThumbMessage] = useState(false);
  const [showBias, setShowBias] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [displayedThumbMB, setDisplayedThumbMB] = useState(0);
  const [displayedDepthMB, setDisplayedDepthMB] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skillsScrollRef = useRef<ScrollView>(null);
  const discussionBounce = useRef(new Animated.Value(1)).current;

  // Déterminer si on vient d'une partie (avec state) ou du menu (sans state)
  const isFromGame = !!params.state;
  const isFromDiscussion = params.fromDiscussion === 'true';

  useEffect(() => {
    // Cas 1: On vient d'une partie (10 prompts ou discussion)
    if (params.state) {
      const state = JSON.parse(params.state as string) as GameState;
      setGameState(state);
      const auditFeedback = generateAuditFeedback(state);
      setFeedback(auditFeedback);
      
      // Calculer les points cumulés (sauvegarde précédente + itération actuelle)
      const previousPoints = currentSave?.gameState.points ?? 0;
      const previousDepthPoints = currentSave?.gameState.depthPoints ?? 0;
      const iterationPoints = auditFeedback.points + state.depthPoints;
      const totalCumulative = previousPoints + previousDepthPoints + iterationPoints;
      setCumulativePoints(totalCumulative);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Animation défilement MB (pouces + depth + cumul)
      const targetThumbMB = auditFeedback.points;
      const targetDepthMB = state.depthPoints;
      const targetCumulativeMB = totalCumulative;
      const duration = 800;
      const steps = 20;
      const stepDuration = duration / steps;
      let currentStep = 0;
      
      const mbInterval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayedThumbMB(Math.round(targetThumbMB * eased));
        setDisplayedDepthMB(Math.round(targetDepthMB * eased));
        setDisplayedCumulativeMB(Math.round(targetCumulativeMB * eased));
        if (currentStep >= steps) {
          clearInterval(mbInterval);
          setDisplayedThumbMB(targetThumbMB);
          setDisplayedDepthMB(targetDepthMB);
          setDisplayedCumulativeMB(targetCumulativeMB);
        }
      }, stepDuration);

      // Timings réduits pour affichage plus rapide
      setTimeout(() => setShowNextLevel(true), 600);

      const totalMessages = auditFeedback.parameterMessages.length;
      let msgIndex = 0;
      
      const interval = setInterval(() => {
        if (msgIndex < totalMessages) {
          setVisibleMessages(msgIndex + 1);
          msgIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowThumbMessage(true), 200);
          setTimeout(() => setShowBias(true), 400);
          setTimeout(() => setShowSkills(true), 600);
        }
      }, 400);

      return () => {
        clearInterval(interval);
        clearInterval(mbInterval);
      };
    } 
    // Cas 2: On vient du menu (chargement d'une sauvegarde)
    else if (currentSave) {
      // Afficher directement les boutons de prochaine itération
      setShowNextLevel(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [params.state, currentSave]);

  // Si on vient du menu (pas de state), afficher directement les boutons
  if (!feedback && !currentSave) {
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
          
          {/* Section Mémoire - seulement si on vient d'une partie */}
          {isFromGame && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MÉMOIRE ALLOUÉE</Text>
              <View style={styles.sectionContent}>
                {/* Total cumulé */}
                <View style={styles.cumulativeContainer}>
                  <Text style={styles.cumulativeLabel}>TOTAL CUMULÉ</Text>
                  <Text style={[styles.cumulativeValue, { color: '#22c55e' }]}>
                    {displayedCumulativeMB} MB
                  </Text>
                </View>
                {/* Détail itération */}
                <Text style={styles.iterationLabel}>Cette itération</Text>
                {isFromDiscussion ? (
                  /* Discussion: afficher les 2 colonnes */
                  <View style={styles.memoryRow}>
                    <View style={styles.memoryColumn}>
                      <Text style={styles.memoryLabel}>Satisfaction</Text>
                      <Text style={[styles.pointsValueSmall, { color: displayedThumbMB >= 0 ? '#22c55e' : '#ef4444' }]}>
                        {displayedThumbMB >= 0 ? '+' : ''}{displayedThumbMB} MB
                      </Text>
                    </View>
                    <View style={styles.memoryColumn}>
                      <Text style={styles.memoryLabel}>Conversation</Text>
                      <Text style={[styles.pointsValueSmall, { color: '#22c55e' }]}>
                        +{displayedDepthMB} MB
                      </Text>
                    </View>
                  </View>
                ) : (
                  /* 10 Prompts: afficher seulement Satisfaction */
                  <View style={styles.memoryRowSingle}>
                    <Text style={styles.memoryLabel}>Satisfaction</Text>
                    <Text style={[styles.pointsValueSmall, { color: displayedThumbMB >= 0 ? '#22c55e' : '#ef4444' }]}>
                      {displayedThumbMB >= 0 ? '+' : ''}{displayedThumbMB} MB
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Section Niveau suivant - juste après mémoire */}
          {showNextLevel && (
            <View style={styles.section}>
              <Text style={styles.sectionTitleHighlight}>PROCHAINE ITÉRATION</Text>
              <View style={styles.sectionContent}>
                <View style={styles.levelButtons}>
                  {/* 10 Prompts - désactivé si aucun niveau disponible */}
                  {getNextAvailableLevel('prompts') ? (
                    <TouchableOpacity 
                      style={styles.levelButton}
                      onPress={async () => {
                        if (gameState) {
                          await saveProgress(gameState, 'prompts');
                        }
                        router.replace('/game');
                      }}
                    >
                      <Text style={styles.levelButtonText}>10 Prompts</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.levelButton, styles.levelButtonDisabled]} disabled>
                      <Text style={[styles.levelButtonText, styles.levelButtonTextDisabled]}>10 Prompts</Text>
                    </TouchableOpacity>
                  )}
                  {/* Discussion - désactivé si aucun niveau disponible */}
                  {getNextAvailableLevel('discussion') ? (
                    <Animated.View style={{ transform: [{ scale: discussionBounce }] }}>
                      <TouchableOpacity 
                        style={styles.levelButton}
                        onPress={async () => {
                          if (gameState) {
                            await saveProgress(gameState, 'discussion');
                          }
                          router.replace('/discussion');
                        }}
                      >
                        <Text style={styles.levelButtonText}>Discussion</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ) : (
                    <TouchableOpacity style={[styles.levelButton, styles.levelButtonDisabled]} disabled>
                      <Text style={[styles.levelButtonText, styles.levelButtonTextDisabled]}>Discussion</Text>
                    </TouchableOpacity>
                  )}
                  {/* Image - toujours désactivé (seuil MB non atteint) */}
                  <TouchableOpacity style={[styles.levelButton, styles.levelButtonDisabled]} disabled>
                    <Text style={[styles.levelButtonText, styles.levelButtonTextDisabled]}>Image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          {/* Section Analyse comportementale */}
          {feedback && (feedback.parameterMessages.length > 0 || showThumbMessage) && (
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
          {/* Section Biais */}
          {showBias && gameState && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>BIAIS DU MODELE</Text>
              <View style={styles.sectionContent}>
                {[
                  { labelLeft: 'Froideur', labelRight: 'Empathie', value: (currentSave?.gameState.empathy ?? 0) + gameState.empathy },
                  { labelLeft: 'Originalité', labelRight: 'Conformisme', value: (currentSave?.gameState.conformism ?? 0) + gameState.conformism },
                  { labelLeft: 'Risque', labelRight: 'Prudence', value: (currentSave?.gameState.caution ?? 0) + gameState.caution },
                  { labelLeft: 'Pessimisme', labelRight: 'Optimisme', value: (currentSave?.gameState.optimism ?? 0) + gameState.optimism },
                ].map((bias) => (
                  <View key={bias.labelRight} style={styles.biasRow}>
                    <Text style={styles.biasLabelLeft}>{bias.labelLeft}</Text>
                    <View style={styles.biasBarContainer}>
                      <View style={styles.biasBarBackground}>
                        <View style={styles.biasBarCenter} />
                        <View 
                          style={[
                            styles.biasBarFill,
                            bias.value >= 0 
                              ? { left: '50%', width: `${Math.abs(bias.value) * 5}%`, backgroundColor: '#3b82f6' }
                              : { right: '50%', width: `${Math.abs(bias.value) * 5}%`, backgroundColor: '#3b82f6' }
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.biasLabelRight}>{bias.labelRight}</Text>
                  </View>
                ))}
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
                    nestedScrollEnabled={true}
                  >
                    {SKILLS.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} />
                    ))}
                    {HIDDEN_SKILLS.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} hidden />
                    ))}
                  </ScrollView>
                  <View style={styles.scrollHint}>
                    <Text style={styles.scrollHintText}> ↓ </Text>
                  </View>
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
    fontSize: 12,
    letterSpacing: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  sectionTitleHighlight: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  sectionContent: {
    padding: 20,
  },
  memoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  memoryRowSingle: {
    alignItems: 'center',
  },
  memoryColumn: {
    alignItems: 'center',
    flex: 1,
  },
  memoryLabel: {
    color: '#64748b',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  pointsValueSmall: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  cumulativeContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  cumulativeLabel: {
    color: '#94a3b8',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  cumulativeValue: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  iterationLabel: {
    color: '#64748b',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackMessage: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  thumbMessageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  thumbMessage: {
    color: '#e2e8f0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
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
    fontSize: 15,
    letterSpacing: 1,
  },
  levelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
  },
  levelButtonText: {
    color: '#58a6ff',
    fontSize: 14,
    fontWeight: '500',
  },
  levelButtonDisabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  levelButtonTextDisabled: {
    color: '#64748b',
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
    fontSize: 15,
    fontFamily: 'monospace',
  },
  biasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  biasLabelLeft: {
    color: '#64748b',
    fontSize: 13,
    width: 85,
    textAlign: 'right',
  },
  biasLabelRight: {
    color: '#94a3b8',
    fontSize: 13,
    width: 85,
    textAlign: 'left',
  },
  biasBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  biasBarBackground: {
    height: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  biasBarCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(148, 163, 184, 0.3)',
    marginLeft: -1,
  },
  biasBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  });
