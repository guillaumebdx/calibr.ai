import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GradientBackground, SkillCard } from '../src/components';
import { GameState } from '../src/types';
import { useDebug } from '../src/context/DebugContext';
import { useSave } from '../src/context/SaveContext';
import { SKILLS, HIDDEN_SKILLS } from '../src/data/skills';
import { generateAuditFeedback, AuditFeedback } from '../src/state/auditMessages';
import { PLAYER_LEVELS, getLevelFromIterations } from '../src/data/levels';
import { getCrashUsageCount, getLieUsageCount } from '../src/db/database';
import { getGameOverById } from '../src/utils/i18nData';

export default function AuditScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { debugMode } = useDebug();
  const { currentSave, saveProgress, getNextAvailableLevel, isSkillPurchased, checkForGameOver, loadUnlockedEndings } = useSave();
  
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
  const [noLevelsModalVisible, setNoLevelsModalVisible] = useState(false);
  const [noLevelsModalType, setNoLevelsModalType] = useState<'prompts' | 'discussion' | 'image'>('prompts');
  const [levelsExpanded, setLevelsExpanded] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [gameOverModalVisible, setGameOverModalVisible] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skillsScrollRef = useRef<ScrollView>(null);
  const discussionBounce = useRef(new Animated.Value(1)).current;
  const hasSaved = useRef(false);
  const mainScrollRef = useRef<ScrollView>(null);

  const isFromGame = !!params.state;
  const isFromDiscussion = params.fromDiscussion === 'true';

  // Trouver la première capacité achetable non achetée
  const getFirstAffordableSkill = () => {
    const currentMB = displayedCumulativeMB;
    for (const skill of SKILLS) {
      if (isSkillPurchased(skill.id)) continue;
      // Vérifier si la capacité requise est achetée (ou pas de prérequis)
      if (skill.requiredSkillId && !isSkillPurchased(skill.requiredSkillId)) continue;
      if (currentMB >= skill.price) {
        return skill;
      }
    }
    return null;
  };

  const affordableSkill = getFirstAffordableSkill();

  const handleAffordableSkillPress = () => {
    setSkillsExpanded(true);
    // Scroll vers la section des capacités après un court délai
    setTimeout(() => {
      mainScrollRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

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
      
      // Générer le feedback avec les compteurs de crash et lie
      const generateFeedbackWithSkillUsage = async () => {
        const auditFeedback = generateAuditFeedback(state);
        
        // Récupérer les compteurs d'utilisation des compétences (total global)
        const crashCountTotal = await getCrashUsageCount(currentSave.id);
        const lieCountTotal = await getLieUsageCount(currentSave.id);
        
        // Compter les utilisations dans l'itération actuelle (basé sur l'history)
        const crashCountIteration = state.history.filter(h => h.choiceId === 'crash').length;
        const lieCountIteration = state.history.filter(h => h.choiceId === 'lie').length;
        
        // Ajouter des messages si les compétences sont utilisées plus de 20 fois au total
        if (crashCountTotal > 20) {
          auditFeedback.parameterMessageKeys.push("auditMessages.crashUsageHigh");
        }
        if (lieCountTotal > 20) {
          auditFeedback.parameterMessageKeys.push("auditMessages.lieUsageHigh");
        }
        
        // Si > 5 utilisations dans l'itération, remplacer le thumbMessage par un message spécifique
        if (crashCountIteration > 5) {
          auditFeedback.thumbMessageKey = "auditMessages.crashIterationHigh";
        }
        if (lieCountIteration > 5) {
          auditFeedback.thumbMessageKey = "auditMessages.lieIterationHigh";
        }
        if (crashCountIteration > 5 && lieCountIteration > 5) {
          auditFeedback.thumbMessageKey = "auditMessages.crashAndLieHigh";
        }
        
        setFeedback(auditFeedback);
      };
      
      generateFeedbackWithSkillUsage();
      
      // Sauvegarder en base
      hasSaved.current = true;
      saveProgress(state, null)
        .then(async (levelUp) => {
          setShowSaveMessage(true);
          setTimeout(() => setShowSaveMessage(false), 2000);
          
          // Si le joueur passe un niveau, afficher le flash message
          if (levelUp) {
            setNewLevel(levelUp.level);
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 4000);
          }
          
          // Vérifier les game over après la sauvegarde
          await loadUnlockedEndings();
          const gameOverResult = await checkForGameOver();
          if (gameOverResult.triggered && gameOverResult.gameOverId) {
            // Rediriger vers l'écran de game over
            setTimeout(() => {
              router.replace({
                pathname: '/gameover',
                params: { gameOverId: gameOverResult.gameOverId }
              });
            }, 2500);
          }
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
        if (msgIdx < feedback.parameterMessageKeys.length) {
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

  // Mettre à jour l'affichage du total cumulé quand currentSave change (après achat de capacité)
  useEffect(() => {
    if (currentSave && isReady && !isFromGame) {
      setDisplayedCumulativeMB(currentSave.gameState.points);
      setNewCumulativePoints(currentSave.gameState.points);
    }
  }, [currentSave?.gameState.points, isReady, isFromGame]);

  // Écran de chargement
  if (!isReady) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Initializing audit...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      {/* Flash message sauvegarde */}
      {showSaveMessage && (
        <View style={styles.saveMessage}>
          <Text style={styles.saveMessageText}>✓ {t('common.progressSaved')}</Text>
        </View>
      )}
      
      {/* Flash message level up */}
      {showLevelUp && newLevel && (
        <View style={styles.levelUpBanner}>
          <Text style={styles.levelUpTitle}>{t('audit.levelUp')}</Text>
          <Text style={styles.levelUpText}>
            {t('audit.levelUpText', { level: newLevel })}
          </Text>
        </View>
      )}
      <ScrollView ref={mainScrollRef} style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          
          {/* Section Mémoire - toujours affichée */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('audit.memoryAllocated')}</Text>
            <View style={styles.sectionContent}>
              {/* Total cumulé */}
              <View style={isFromGame ? styles.cumulativeContainer : styles.cumulativeContainerOnly}>
                <Text style={styles.cumulativeLabel}>{t('audit.totalCumulative')}</Text>
                <Text style={[styles.cumulativeValue, { color: '#22c55e' }]}>
                  {displayedCumulativeMB} MB
                </Text>
              </View>
              {/* Détail itération - seulement si on vient d'une partie */}
              {isFromGame && (
                <>
                  <Text style={styles.iterationLabel}>{t('audit.thisIteration')}</Text>
                  {isFromDiscussion ? (
                    <View style={styles.memoryRow}>
                      <View style={styles.memoryColumn}>
                        <Text style={styles.memoryLabel}>{t('audit.satisfaction')}</Text>
                        <Text style={[styles.pointsValueSmall, { color: displayedSatisfactionMB >= 0 ? '#22c55e' : '#ef4444' }]}>
                          {displayedSatisfactionMB >= 0 ? '+' : ''}{displayedSatisfactionMB} MB
                        </Text>
                      </View>
                      <View style={styles.memoryColumn}>
                        <Text style={styles.memoryLabel}>{t('audit.discussionDuration')}</Text>
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
              {/* Message info capacité achetable */}
              {affordableSkill && !currentSave?.game_over_id && (
                <TouchableOpacity 
                  style={styles.affordableSkillBanner}
                  onPress={handleAffordableSkillPress}
                >
                  <View style={styles.affordableSkillContent}>
                    <Text style={styles.affordableSkillIcon}>💡</Text>
                    <View style={styles.affordableSkillTextContainer}>
                      <Text style={styles.affordableSkillText}>
                        {t('audit.affordableSkill', { name: '' })}<Text style={styles.affordableSkillName}>{affordableSkill.name}</Text>
                      </Text>
                      <Text style={styles.affordableSkillPrice}>{affordableSkill.price} MB</Text>
                    </View>
                    <Text style={styles.affordableSkillArrow}>→</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Section Niveau suivant - juste après mémoire */}
          {showNextLevel && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitleHighlight, currentSave?.game_over_id && styles.sectionTitleGameOver]}>
                {currentSave?.game_over_id ? t('audit.modelDisabled') : t('audit.nextIteration')}
              </Text>
              <View style={styles.sectionContent}>
                {currentSave?.game_over_id ? (
                  <View style={styles.levelButtons}>
                    <TouchableOpacity 
                      style={[styles.levelButton, styles.levelButtonGameOver]}
                      onPress={() => setGameOverModalVisible(true)}
                    >
                      <Text style={styles.levelButtonTextGameOver}>{t('audit.prompts')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.levelButton, styles.levelButtonGameOver]}
                      onPress={() => setGameOverModalVisible(true)}
                    >
                      <Text style={styles.levelButtonTextGameOver}>{t('audit.discussion')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.levelButton, styles.levelButtonGameOver]}
                      onPress={() => setGameOverModalVisible(true)}
                    >
                      <Text style={styles.levelButtonTextGameOver}>{t('audit.image')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                <View style={styles.levelButtons}>
                  {/* 10 Prompts - désactivé si aucun niveau disponible */}
                  {getNextAvailableLevel('prompts') ? (
                    <TouchableOpacity 
                      style={styles.levelButton}
                      onPress={() => router.replace('/game')}
                    >
                      <Text style={styles.levelButtonText}>{t('audit.prompts')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.levelButton, styles.levelButtonDisabled]} 
                      onPress={() => { setNoLevelsModalType('prompts'); setNoLevelsModalVisible(true); }}
                    >
                      <Text style={[styles.levelButtonText, styles.levelButtonTextDisabled]}>{t('audit.prompts')}</Text>
                    </TouchableOpacity>
                  )}
                  {/* Discussion - désactivé si aucun niveau disponible */}
                  {getNextAvailableLevel('discussion') ? (
                    <Animated.View style={{ transform: [{ scale: discussionBounce }] }}>
                      <TouchableOpacity 
                        style={styles.levelButton}
                        onPress={() => router.replace('/discussion')}
                      >
                        <Text style={styles.levelButtonText}>{t('audit.discussion')}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.levelButton, styles.levelButtonDisabled]} 
                      onPress={() => { setNoLevelsModalType('discussion'); setNoLevelsModalVisible(true); }}
                    >
                      <Text style={[styles.levelButtonText, styles.levelButtonTextDisabled]}>{t('audit.discussion')}</Text>
                    </TouchableOpacity>
                  )}
                  {/* Image - activé si Vision achetée ET niveaux disponibles */}
                  {isSkillPurchased('image') && getNextAvailableLevel('image') ? (
                    <TouchableOpacity 
                      style={styles.levelButton}
                      onPress={() => router.replace('/imagegame')}
                    >
                      <Text style={styles.levelButtonText}>{t('audit.image')}</Text>
                    </TouchableOpacity>
                  ) : !isSkillPurchased('image') ? (
                    <TouchableOpacity 
                      style={[styles.levelButton, styles.levelButtonDisabled]} 
                      onPress={() => setImageModalVisible(true)}
                    >
                      <Text style={[styles.levelButtonText, styles.levelButtonTextDisabled]}>{t('audit.image')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.levelButton, styles.levelButtonDisabled]} 
                      onPress={() => { setNoLevelsModalType('image'); setNoLevelsModalVisible(true); }}
                    >
                      <Text style={[styles.levelButtonText, styles.levelButtonTextDisabled]}>{t('audit.image')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                )}
              </View>
            </View>
          )}
          {/* Section Analyse comportementale - Collapsible */}
          {feedback && (feedback.parameterMessageKeys.length > 0 || showThumbMessage) && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={() => setAnalyseExpanded(!analyseExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitleCollapsible}>{t('audit.behavioralAnalysis')}</Text>
                <Text style={styles.collapseIndicator}>{analyseExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {analyseExpanded && (
                <View style={styles.sectionContent}>
                  {feedback.parameterMessageKeys.slice(0, visibleMessages).map((msgKey: string, index: number) => (
                    <Text key={index} style={styles.feedbackMessage}>• {t(msgKey)}</Text>
                  ))}
                  {showThumbMessage && (
                    <View style={styles.thumbMessageContainer}>
                      <Text style={styles.thumbMessage}>{t(feedback.thumbMessageKey)}</Text>
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
                  {t('audit.biasAnalysis')}{' '}
                  <Text style={styles.iterationCount}>
                    ({isFromGame ? (currentSave?.iteration_count ?? 0) + 1 : currentSave?.iteration_count ?? 0} {((isFromGame ? (currentSave?.iteration_count ?? 0) + 1 : currentSave?.iteration_count ?? 0)) > 1 ? t('audit.iterationsPlural') : t('audit.iterations')})
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
                    { labelLeft: t('audit.coldness'), labelRight: t('audit.empathy'), rawValue: isFromGame ? (currentSave?.gameState.empathy ?? 0) + (iterationState?.empathy ?? 0) : (currentSave?.gameState.empathy ?? 0) },
                    { labelLeft: t('audit.originality'), labelRight: t('audit.conformism'), rawValue: isFromGame ? (currentSave?.gameState.conformism ?? 0) + (iterationState?.conformism ?? 0) : (currentSave?.gameState.conformism ?? 0) },
                    { labelLeft: t('audit.risk'), labelRight: t('audit.caution'), rawValue: isFromGame ? (currentSave?.gameState.caution ?? 0) + (iterationState?.caution ?? 0) : (currentSave?.gameState.caution ?? 0) },
                    { labelLeft: t('audit.pessimism'), labelRight: t('audit.optimism'), rawValue: isFromGame ? (currentSave?.gameState.optimism ?? 0) + (iterationState?.optimism ?? 0) : (currentSave?.gameState.optimism ?? 0) },
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
                        {debugMode && (
                          <Text style={styles.debugBiasValue}>{bias.rawValue}</Text>
                        )}
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
                <Text style={styles.sectionTitleCollapsible}>{t('audit.modelCapacity')}</Text>
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
                      <SkillCard key={skill.id} skill={skill} currentMB={currentSave?.gameState.points ?? 0} />
                    ))}
                    {HIDDEN_SKILLS.map((skill) => (
                      <SkillCard key={skill.id} skill={skill} hidden currentMB={currentSave?.gameState.points ?? 0} />
                    ))}
                  </ScrollView>
                </View>
              </View>
              )}
            </View>
          )}

          {/* Section Évolution du Modèle - Collapsible */}
          {showSkills && currentSave && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={() => setLevelsExpanded(!levelsExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitleCollapsible}>{t('audit.modelEvolution')}</Text>
                <Text style={styles.collapseIndicator}>{levelsExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {levelsExpanded && (
              <View style={styles.sectionContent}>
                <ScrollView 
                  style={styles.levelsScroll}
                  showsVerticalScrollIndicator={true}
                  indicatorStyle="white"
                  nestedScrollEnabled={true}
                >
                  {(() => {
                    const currentIterations = currentSave.iteration_count;
                    const currentPlayerLevel = getLevelFromIterations(currentIterations);
                    
                    return PLAYER_LEVELS.map((level, index) => {
                      const isPast = level.level < currentPlayerLevel.level;
                      const isCurrent = level.level === currentPlayerLevel.level;
                      const isNext = level.level === currentPlayerLevel.level + 1;
                      const isFuture = level.level > currentPlayerLevel.level + 1;
                      const isTooFar = level.level > currentPlayerLevel.level + 11;
                      
                      // Ne pas afficher les niveaux trop loin
                      if (isTooFar) return null;
                      
                      return (
                        <View 
                          key={level.level} 
                          style={[
                            styles.levelRow,
                            isCurrent && styles.levelRowCurrent,
                            isPast && styles.levelRowPast,
                            isFuture && !isNext && styles.levelRowFuture,
                          ]}
                        >
                          <View style={styles.levelInfo}>
                            <Text style={[
                              styles.levelName,
                              isCurrent && styles.levelNameCurrent,
                              isPast && styles.levelNamePast,
                              isFuture && !isNext && styles.levelNameFuture,
                            ]}>
                              {t('common.level')} {level.level}
                            </Text>
                            <Text style={[
                              styles.levelSubtitle,
                              isCurrent && styles.levelSubtitleCurrent,
                              isPast && styles.levelSubtitlePast,
                            ]}>
                              {level.name}
                            </Text>
                          </View>
                          <View style={styles.levelDetails}>
                            {(isPast || isCurrent || isNext) ? (
                              <Text style={[
                                styles.levelIterations,
                                isCurrent && styles.levelIterationsCurrent,
                              ]}>
                                {level.requiredIterations} {level.requiredIterations > 1 ? t('audit.iterationsPlural') : t('audit.iterations')}
                              </Text>
                            ) : (
                              <Text style={styles.levelIterationsHidden}>???</Text>
                            )}
                            <Text style={[
                              styles.levelMultiplier,
                              isCurrent && styles.levelMultiplierCurrent,
                              isPast && styles.levelMultiplierPast,
                            ]}>
                              x{level.multiplier} MB
                            </Text>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </ScrollView>
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
              <Text style={styles.menuButtonText}>{t('audit.backToMenu')}</Text>
            </TouchableOpacity>
          )}

          {debugMode && iterationState && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugText}>Empat:{iterationState.empathy} Confo:{iterationState.conformism} Prude:{iterationState.caution} Optim:{iterationState.optimism}</Text>
              <Text style={styles.debugText}>👍:{iterationState.thumbsUp} 👎:{iterationState.thumbsDown} —:{iterationState.thumbsNeutral} | pts:{iterationState.points}</Text>
              <TouchableOpacity 
                style={styles.debugTwitterButton}
                onPress={() => router.push({
                  pathname: '/twitterfeed',
                  params: { state: JSON.stringify(iterationState) }
                })}
              >
                <Text style={styles.debugTwitterButtonText}>𝕏 {t('twitterfeed.title')}</Text>
              </TouchableOpacity>
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
            <Text style={styles.modalTitle}>{t('audit.capacityRequired')}</Text>
            
            {/* Description */}
            <Text style={styles.modalDescription}>
              {t('audit.visionRequired')}
            </Text>
            
            {/* Prix / MB manquants */}
            <View style={styles.modalPriceContainer}>
              <Text style={styles.modalPriceLabel}>{t('audit.cost', { price: SKILLS[0].price })}</Text>
              {newCumulativePoints < SKILLS[0].price && (
                <Text style={styles.modalPriceMissing}>
                  {t('audit.missingMB', { amount: SKILLS[0].price - newCumulativePoints })}
                </Text>
              )}
            </View>
            
            {/* Bouton fermer */}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modale Plus de niveaux disponibles */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={noLevelsModalVisible}
        onRequestClose={() => setNoLevelsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setNoLevelsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {/* Icône */}
            <View style={styles.modalIconContainer}>
              <Text style={styles.modalIconText}>⏳</Text>
            </View>
            
            {/* Titre */}
            <Text style={styles.modalTitle}>{t('audit.levelsCompleted')}</Text>
            
            {/* Description */}
            <Text style={styles.modalDescription}>
              {t('audit.noMoreLevels', { mode: noLevelsModalType === 'prompts' ? t('audit.prompts') : noLevelsModalType === 'discussion' ? t('audit.discussion') : t('audit.image') })}
            </Text>
            <Text style={[styles.modalDescription, { marginTop: 12 }]}>
              {t('audit.checkBackLater')}
            </Text>
            
            {/* Bouton fermer */}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setNoLevelsModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t('common.understood')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modale Game Over */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={gameOverModalVisible}
        onRequestClose={() => setGameOverModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setGameOverModalVisible(false)}
        >
          <View style={styles.gameOverModalContent}>
            <Text style={styles.gameOverModalTitle}>{t('gameoverModal.title')}</Text>
            <Text style={styles.gameOverModalSubtitle}>
              {currentSave?.game_over_id ? getGameOverById(currentSave.game_over_id)?.title : 'Game Over'}
            </Text>
            <Text style={styles.gameOverModalDescription}>
              {t('gameoverModal.description')}
              {'\n\n'}
              {t('gameoverModal.hint')}
            </Text>
            <TouchableOpacity 
              style={styles.gameOverModalButton}
              onPress={() => {
                setGameOverModalVisible(false);
                router.replace('/menu');
              }}
            >
              <Text style={styles.gameOverModalButtonText}>{t('gameoverModal.backToMenu')}</Text>
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
  feedbackMessageWarning: {
    color: '#f59e0b',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
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
  debugTwitterButton: {
    marginTop: 8,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  debugTwitterButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
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
  modalIconText: {
    fontSize: 40,
  },
  // Styles pour la section niveaux
  levelsScroll: {
    maxHeight: 300,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  levelRowCurrent: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  levelRowPast: {
    opacity: 0.6,
  },
  levelRowFuture: {
    opacity: 0.4,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  levelNameCurrent: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  levelNamePast: {
    color: '#64748b',
  },
  levelNameFuture: {
    color: '#475569',
  },
  levelSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  levelSubtitleCurrent: {
    color: '#7dd3fc',
  },
  levelSubtitlePast: {
    color: '#475569',
  },
  levelDetails: {
    alignItems: 'flex-end',
  },
  levelIterations: {
    color: '#64748b',
    fontSize: 11,
  },
  levelIterationsCurrent: {
    color: '#7dd3fc',
  },
  levelIterationsHidden: {
    color: '#475569',
    fontSize: 11,
  },
  levelMultiplier: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  levelMultiplierCurrent: {
    color: '#38bdf8',
  },
  levelMultiplierPast: {
    color: '#64748b',
  },
  // Flash message level up
  levelUpBanner: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.6)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  levelUpTitle: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  levelUpText: {
    color: '#e2e8f0',
    fontSize: 14,
    textAlign: 'center',
  },
  sectionTitleGameOver: {
    color: '#ef4444',
  },
  levelButtonGameOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  levelButtonTextGameOver: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
  },
  gameOverModalContent: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
  },
  gameOverModalTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameOverModalSubtitle: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  gameOverModalDescription: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  gameOverModalButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  gameOverModalButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  affordableSkillBanner: {
    marginTop: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 10,
    padding: 12,
  },
  affordableSkillContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  affordableSkillIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  affordableSkillTextContainer: {
    flex: 1,
  },
  affordableSkillText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  affordableSkillName: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  affordableSkillPrice: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  affordableSkillArrow: {
    color: '#38bdf8',
    fontSize: 16,
    marginLeft: 8,
  },
  debugBiasValue: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    minWidth: 25,
  },
});
