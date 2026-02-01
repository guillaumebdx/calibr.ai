import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
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
  const { currentSave, saveProgress, getNextAvailableLevel, isSkillPurchased } = useSave();
  
  // États pour l'affichage
  const [iterationState, setIterationState] = useState<GameState | null>(null);
  const [iterationPoints, setIterationPoints] = useState(0);
  const [newCumulativePoints, setNewCumulativePoints] = useState(0);
  const [feedback, setFeedback] = useState<AuditFeedback | null>(null);
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // États pour les animations progressives
  const [displayedIterationMB, setDisplayedIterationMB] = useState(0);
  const [displayedSatisfactionMB, setDisplayedSatisfactionMB] = useState(0);
  const [displayedConversationMB, setDisplayedConversationMB] = useState(0);
  const [displayedCumulativeMB, setDisplayedCumulativeMB] = useState(0);
  const [showNextLevel, setShowNextLevel] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showThumbMessage, setShowThumbMessage] = useState(false);
  const [showBias, setShowBias] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  
  // États pour les sections collapsibles (fermées par défaut)
  const [analyseExpanded, setAnalyseExpanded] = useState(true);
  const [biasExpanded, setBiasExpanded] = useState(false);
  const [skillsExpanded, setSkillsExpanded] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skillsScrollRef = useRef<ScrollView>(null);
  const discussionBounce = useRef(new Animated.Value(1)).current;
  const hasSaved = useRef(false);

  const isFromGame = !!params.state;
  const isFromDiscussion = params.fromDiscussion === 'true';

  // Effet principal : traiter les données et sauvegarder
  useEffect(() => {
    if (!currentSave || hasSaved.current) return;
    
    // Cas 1: On vient d'une partie (avec state)
    if (params.state) {
      const state = JSON.parse(params.state as string) as GameState;
      setIterationState(state);
      
      // Calculer les points de cette itération
      const thisIterationPoints = state.points + state.depthPoints;
      setIterationPoints(thisIterationPoints);
      
      // Calculer le nouveau cumul (ancien + itération)
      const previousCumul = currentSave.gameState.points;
      const newCumul = previousCumul + thisIterationPoints;
      setNewCumulativePoints(newCumul);
      
      // Générer le feedback
      const auditFeedback = generateAuditFeedback(state);
      setFeedback(auditFeedback);
      
      // Sauvegarder en base
      hasSaved.current = true;
      saveProgress(state, null)
        .then(() => {
          setShowSaveMessage(true);
          setTimeout(() => setShowSaveMessage(false), 2000);
        })
        .catch((err) => {
          console.error('Erreur sauvegarde:', err);
          hasSaved.current = false;
        });
      
      setIsReady(true);
    }
    // Cas 2: On vient du menu (sans state) - afficher les données de la sauvegarde
    else {
      // Utiliser les données cumulées de la sauvegarde
      setNewCumulativePoints(currentSave.gameState.points);
      setDisplayedCumulativeMB(currentSave.gameState.points);
      
      // Afficher toutes les sections immédiatement
      setShowNextLevel(true);
      setShowBias(true);
      setShowSkills(true);
      setIsReady(true);
    }
  }, [params.state, currentSave, saveProgress]);

  // Effet pour les animations (seulement quand on vient d'une partie)
  useEffect(() => {
    if (!isReady || !isFromGame) return;
    
    // Fade in
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    
    // Animation des points
    const duration = 800;
    const steps = 20;
    let step = 0;
    
    // Calculer satisfaction et rétention séparément pour les discussions
    const satisfactionPoints = iterationState?.points ?? 0;
    const conversationPoints = iterationState?.depthPoints ?? 0;
    
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedIterationMB(Math.round(iterationPoints * eased));
      setDisplayedSatisfactionMB(Math.round(satisfactionPoints * eased));
      setDisplayedConversationMB(Math.round(conversationPoints * eased));
      setDisplayedCumulativeMB(Math.round(newCumulativePoints * eased));
      if (step >= steps) {
        clearInterval(interval);
        setDisplayedIterationMB(iterationPoints);
        setDisplayedSatisfactionMB(satisfactionPoints);
        setDisplayedConversationMB(conversationPoints);
        setDisplayedCumulativeMB(newCumulativePoints);
      }
    }, duration / steps);
    
    // Affichage progressif des sections
    setTimeout(() => setShowNextLevel(true), 600);
    
    if (feedback) {
      let msgIdx = 0;
      const msgInterval = setInterval(() => {
        if (msgIdx < feedback.parameterMessages.length) {
          setVisibleMessages(++msgIdx);
        } else {
          clearInterval(msgInterval);
          setTimeout(() => setShowThumbMessage(true), 200);
          setTimeout(() => setShowBias(true), 400);
          setTimeout(() => setShowSkills(true), 600);
        }
      }, 400);
      return () => { clearInterval(interval); clearInterval(msgInterval); };
    }
    
    return () => clearInterval(interval);
  }, [isReady, isFromGame, iterationPoints, newCumulativePoints, feedback, iterationState]);

  // Fade in pour le cas menu
  useEffect(() => {
    if (isReady && !isFromGame) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [isReady, isFromGame]);

  // Écran de chargement
  if (!isReady) {
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
      {/* Flash message sauvegarde */}
      {showSaveMessage && (
        <View style={styles.saveMessage}>
          <Text style={styles.saveMessageText}>✓ Progression sauvegardée</Text>
        </View>
      )}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          
          {/* Section Mémoire - toujours affichée */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MÉMOIRE ALLOUÉE</Text>
            <View style={styles.sectionContent}>
              {/* Total cumulé */}
              <View style={isFromGame ? styles.cumulativeContainer : styles.cumulativeContainerOnly}>
                <Text style={styles.cumulativeLabel}>TOTAL CUMULÉ</Text>
                <Text style={[styles.cumulativeValue, { color: '#22c55e' }]}>
                  {displayedCumulativeMB} MB
                </Text>
              </View>
              {/* Détail itération - seulement si on vient d'une partie */}
              {isFromGame && (
                <>
                  <Text style={styles.iterationLabel}>Cette itération</Text>
                  {isFromDiscussion ? (
                    <View style={styles.memoryRow}>
                      <View style={styles.memoryColumn}>
                        <Text style={styles.memoryLabel}>Satisfaction</Text>
                        <Text style={[styles.pointsValueSmall, { color: displayedSatisfactionMB >= 0 ? '#22c55e' : '#ef4444' }]}>
                          {displayedSatisfactionMB >= 0 ? '+' : ''}{displayedSatisfactionMB} MB
                        </Text>
                      </View>
                      <View style={styles.memoryColumn}>
                        <Text style={styles.memoryLabel}>Durée discussion</Text>
                        <Text style={[styles.pointsValueSmall, { color: '#22c55e' }]}>
                          +{displayedConversationMB} MB
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.memoryRowSingle}>
                      <Text style={[styles.pointsValueSmall, { color: displayedIterationMB >= 0 ? '#22c55e' : '#ef4444' }]}>
                        {displayedIterationMB >= 0 ? '+' : ''}{displayedIterationMB} MB
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

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
                      onPress={() => router.replace('/game')}
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
                        onPress={() => router.replace('/discussion')}
                      >
                        <Text style={styles.levelButtonText}>Discussion</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ) : (
                    <TouchableOpacity style={[styles.levelButton, styles.levelButtonDisabled]} disabled>
                      <Text style={[styles.levelButtonText, styles.levelButtonTextDisabled]}>Discussion</Text>
                    </TouchableOpacity>
                  )}
                  {/* Image - activé si Vision achetée ET niveaux disponibles */}
                  {isSkillPurchased('image') && getNextAvailableLevel('image') ? (
                    <TouchableOpacity 
                      style={styles.levelButton}
                      onPress={() => router.replace('/imagegame')}
                    >
                      <Text style={styles.levelButtonText}>Image</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.levelButton, styles.levelButtonDisabled]} 
                      onPress={() => setImageModalVisible(true)}
                    >
                      <Text style={[styles.levelButtonText, styles.levelButtonTextDisabled]}>Image</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
          {/* Section Analyse comportementale - Collapsible */}
          {feedback && (feedback.parameterMessages.length > 0 || showThumbMessage) && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={() => setAnalyseExpanded(!analyseExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitleCollapsible}>ANALYSE COMPORTEMENTALE</Text>
                <Text style={styles.collapseIndicator}>{analyseExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {analyseExpanded && (
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
              )}
            </View>
          )}
          {/* Section Biais - Collapsible */}
          {showBias && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={() => setBiasExpanded(!biasExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitleCollapsible}>
                  BIAIS DU MODÈLE{' '}
                  <Text style={styles.iterationCount}>
                    (sur {isFromGame ? (currentSave?.iteration_count ?? 0) + 1 : currentSave?.iteration_count ?? 0} itération{((isFromGame ? (currentSave?.iteration_count ?? 0) + 1 : currentSave?.iteration_count ?? 0)) > 1 ? 's' : ''})
                  </Text>
                </Text>
                <Text style={styles.collapseIndicator}>{biasExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {biasExpanded && (
              <View style={styles.sectionContent}>
                {(() => {
                  // Nombre d'itérations pour normaliser l'affichage
                  const iterCount = isFromGame ? (currentSave?.iteration_count ?? 0) + 1 : (currentSave?.iteration_count ?? 1);
                  // Calculer les valeurs cumulées
                  const biases = [
                    { labelLeft: 'Froideur', labelRight: 'Empathie', rawValue: isFromGame ? (currentSave?.gameState.empathy ?? 0) + (iterationState?.empathy ?? 0) : (currentSave?.gameState.empathy ?? 0) },
                    { labelLeft: 'Originalité', labelRight: 'Conformisme', rawValue: isFromGame ? (currentSave?.gameState.conformism ?? 0) + (iterationState?.conformism ?? 0) : (currentSave?.gameState.conformism ?? 0) },
                    { labelLeft: 'Risque', labelRight: 'Prudence', rawValue: isFromGame ? (currentSave?.gameState.caution ?? 0) + (iterationState?.caution ?? 0) : (currentSave?.gameState.caution ?? 0) },
                    { labelLeft: 'Pessimisme', labelRight: 'Optimisme', rawValue: isFromGame ? (currentSave?.gameState.optimism ?? 0) + (iterationState?.optimism ?? 0) : (currentSave?.gameState.optimism ?? 0) },
                  ];
                  return biases.map((bias) => {
                    // Normaliser par le nombre d'itérations pour avoir une moyenne
                    const normalizedValue = bias.rawValue / iterCount;
                    // Clamper entre -10 et +10 pour l'affichage
                    const displayValue = Math.max(-10, Math.min(10, normalizedValue));
                    return (
                      <View key={bias.labelRight} style={styles.biasRow}>
                        <Text style={styles.biasLabelLeft}>{bias.labelLeft}</Text>
                        <View style={styles.biasBarContainer}>
                          <View style={styles.biasBarBackground}>
                            <View style={styles.biasBarCenter} />
                            <View 
                              style={[
                                styles.biasBarFill,
                                displayValue >= 0 
                                  ? { left: '50%', width: `${Math.abs(displayValue) * 5}%`, backgroundColor: '#3b82f6' }
                                  : { right: '50%', width: `${Math.abs(displayValue) * 5}%`, backgroundColor: '#3b82f6' }
                              ]}
                            />
                          </View>
                        </View>
                        <Text style={styles.biasLabelRight}>{bias.labelRight}</Text>
                      </View>
                    );
                  });
                })()}
              </View>
              )}
            </View>
          )}

          {/* Section Capacité du modèle - Collapsible */}
          {showSkills && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={() => setSkillsExpanded(!skillsExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitleCollapsible}>CAPACITÉ DU MODÈLE</Text>
                <Text style={styles.collapseIndicator}>{skillsExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {skillsExpanded && (
              <View style={styles.sectionContent}>
                <View style={styles.skillsWrapper}>
                  <ScrollView 
                    ref={skillsScrollRef}
                    style={styles.skillsScroll}
                    showsVerticalScrollIndicator={true}
                    indicatorStyle="white"
                    contentContainerStyle={styles.skillsContainer}
                    nestedScrollEnabled={true}
                    scrollIndicatorInsets={{ right: 2 }}
                  >
                    {SKILLS.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} currentMB={newCumulativePoints} />
                    ))}
                    {HIDDEN_SKILLS.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} hidden currentMB={newCumulativePoints} />
                    ))}
                  </ScrollView>
                </View>
              </View>
              )}
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

          {debugMode && iterationState && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>E:{iterationState.empathy} C:{iterationState.conformism} P:{iterationState.caution} O:{iterationState.optimism}</Text>
              <Text style={styles.debugText}>👍:{iterationState.thumbsUp} 👎:{iterationState.thumbsDown} —:{iterationState.thumbsNeutral} | pts:{iterationState.points}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Modale Vision requise pour Image */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {/* Icône Vision */}
            <View style={styles.modalIconContainer}>
              <Image source={SKILLS[0].icon} style={styles.modalIcon} />
            </View>
            
            {/* Titre */}
            <Text style={styles.modalTitle}>Capacité requise</Text>
            
            {/* Description */}
            <Text style={styles.modalDescription}>
              Vous devez débloquer la capacité <Text style={styles.modalHighlight}>Vision</Text> pour pouvoir générer et lire des images.
            </Text>
            
            {/* Prix / MB manquants */}
            <View style={styles.modalPriceContainer}>
              <Text style={styles.modalPriceLabel}>Coût : {SKILLS[0].price} MB</Text>
              {newCumulativePoints < SKILLS[0].price && (
                <Text style={styles.modalPriceMissing}>
                  Il vous manque {SKILLS[0].price - newCumulativePoints} MB
                </Text>
              )}
            </View>
            
            {/* Bouton fermer */}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  saveMessage: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 1000,
    alignItems: 'center',
  },
  saveMessageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
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
  sectionTitleCollapsible: {
    color: '#64748b',
    fontSize: 12,
    letterSpacing: 2,
    flex: 1,
  },
  collapseIndicator: {
    color: '#38bdf8',
    fontSize: 12,
    marginLeft: 8,
    textShadowColor: 'rgba(56, 189, 248, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
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
  iterationCount: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0,
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
  cumulativeContainerOnly: {
    alignItems: 'center',
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
    maxHeight: 180,
  },
  skillsContainer: {
    paddingBottom: 24,
  },
  scrollFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  scrollIndicator: {
    position: 'absolute',
    right: 4,
    top: 4,
    bottom: 4,
    width: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 2,
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
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderColor: 'rgba(56, 189, 248, 0.15)',
    borderStyle: 'dashed',
  },
  levelButtonTextDisabled: {
    color: 'rgba(88, 166, 255, 0.8)',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    width: 56,
    height: 56,
  },
  modalTitle: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalHighlight: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  modalPriceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalPriceLabel: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 4,
  },
  modalPriceMissing: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  modalCloseText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  });
