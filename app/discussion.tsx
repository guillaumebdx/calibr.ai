import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { GradientBackground, ThumbFeedback } from '../src/components';
import { GameState, Discussion, DiscussionNode, DiscussionChoice, ThreadMessage } from '../src/types';
import { initialGameState, applyDiscussionChoice } from '../src/state/gameState';
import { useDebug } from '../src/context/DebugContext';
import { useSave } from '../src/context/SaveContext';
import discussion1Data from '../src/data/discussion1.json';
import discussion2Data from '../src/data/discussion2.json';
import discussion3Data from '../src/data/discussion3.json';

const DISCUSSIONS: Record<string, Discussion> = {
  discussion1: discussion1Data as Discussion,
  discussion2: discussion2Data as Discussion,
  discussion3: discussion3Data as Discussion,
};

function countRemainingNodes(nodeId: string | null, nodes: DiscussionNode[], visited: Set<string> = new Set()): number {
  if (!nodeId || visited.has(nodeId)) return 0;
  visited.add(nodeId);
  
  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.isEnd) return 1;
  
  let maxDepth = 1;
  for (const choice of node.choices) {
    if (choice.nextNodeId) {
      const depth = 1 + countRemainingNodes(choice.nextNodeId, nodes, new Set(visited));
      maxDepth = Math.max(maxDepth, depth);
    }
  }
  return maxDepth;
}

export default function DiscussionScreen() {
  const { debugMode } = useDebug();
  const { getNextAvailableLevel, markLevelAsPlayed, getPlayerLevel } = useSave();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [currentDiscussionId, setCurrentDiscussionId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [currentNodeId, setCurrentNodeId] = useState<string>('');
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [depth, setDepth] = useState(1);
  const [showThumbFeedback, setShowThumbFeedback] = useState(false);
  const [lastThumbValue, setLastThumbValue] = useState<boolean | null>(null);
  
  const typingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const nextDiscussion = getNextAvailableLevel('discussion');
    if (nextDiscussion) {
      setCurrentDiscussionId(nextDiscussion);
      const disc = DISCUSSIONS[nextDiscussion];
      if (disc) {
        setCurrentNodeId(disc.startNodeId);
      }
    }
  }, [getNextAvailableLevel]);

  const discussion = currentDiscussionId ? DISCUSSIONS[currentDiscussionId] : null;
  const currentNode = discussion?.nodes.find(n => n.id === currentNodeId);

  // Ajouter le premier message utilisateur au démarrage
  useEffect(() => {
    if (thread.length === 0 && currentNode) {
      addUserMessage(currentNode.userMessage, currentNode);
    }
  }, [currentNode]);

  const addUserMessage = (text: string, node: typeof currentNode) => {
    const newMessage: ThreadMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      text,
    };
    setThread(prev => [...prev, newMessage]);
    
    // Scroll vers le bas
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Vérifier si c'est un noeud terminal
    if (node?.isEnd) {
      // Calculer les points de profondeur: 5->1MB, 6->2MB, 7->3MB, 8->4MB, 9->5MB, 10->6MB
      const depthBonus = depth >= 5 ? depth - 4 : 0;
      setGameState(prev => ({ ...prev, depthPoints: depthBonus }));
      // Marquer la discussion comme jouée
      if (currentDiscussionId) {
        markLevelAsPlayed(currentDiscussionId);
      }
      setIsEnded(true);
    } else {
      setShowChoices(true);
    }
  };

  const handleChoice = (choice: DiscussionChoice) => {
    setShowChoices(false);
    
    // Afficher le feedback pouce
    if (choice.thumbUp !== undefined) {
      setLastThumbValue(choice.thumbUp);
      setShowThumbFeedback(true);
    }
    
    // Ajouter la réponse de l'IA
    const aiMessage: ThreadMessage = {
      id: `msg-${Date.now()}`,
      type: 'ai',
      text: choice.text,
    };
    setThread(prev => [...prev, aiMessage]);
    
    // Mettre à jour le game state
    const multiplier = getPlayerLevel().multiplier;
    const newState = applyDiscussionChoice(gameState, choice, multiplier);
    setGameState(newState);

    // Scroll vers le bas
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Si fin de conversation
    if (!choice.nextNodeId) {
      setIsEnded(true);
      return;
    }

    // Afficher le typing indicator puis le message suivant
    setIsTyping(true);
    Animated.timing(typingOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Après le délai de typing, afficher le message utilisateur suivant
    setTimeout(() => {
      setIsTyping(false);
      Animated.timing(typingOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      const nextNode = discussion?.nodes.find(n => n.id === choice.nextNodeId);
      if (nextNode) {
        setDepth(prev => prev + 1);
        setCurrentNodeId(nextNode.id);
        addUserMessage(nextNode.userMessage, nextNode);
      }
    }, 2000);
  };

  if (!discussion) {
    // Pas de discussion disponible, retourner au menu
    return (
      <GradientBackground colors={['#212121', '#212121', '#212121']}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.aiText}>Aucune discussion disponible</Text>
          <TouchableOpacity 
            style={{ marginTop: 20, padding: 12 }}
            onPress={() => router.replace('/menu')}
          >
            <Text style={{ color: '#58a6ff', fontSize: 14 }}>Retour au menu</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  const userInfo = `${discussion.user.name}, ${discussion.user.age} ans`;
  const traits = discussion.user.traits.join(' · ');

  return (
    <GradientBackground colors={['#212121', '#212121', '#212121']}>
      <View style={styles.container}>
        {/* Header avec info utilisateur */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.userName}>{userInfo}</Text>
            <Text style={styles.userTraits}>{traits}</Text>
          </View>
          <ThumbFeedback
            thumbValue={lastThumbValue}
            visible={showThumbFeedback}
            onAnimationComplete={() => setShowThumbFeedback(false)}
          />
        </View>

        {/* Thread de messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.threadContainer}
          contentContainerStyle={styles.threadContent}
          showsVerticalScrollIndicator={false}
        >
          {thread.map((message) => (
            message.type === 'user' ? (
              <View key={message.id} style={styles.userMessageContainer}>
                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{message.text}</Text>
                </View>
              </View>
            ) : (
              <View key={message.id} style={styles.aiMessageContainer}>
                <Text style={styles.aiText}>{message.text}</Text>
              </View>
            )
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <Animated.View style={[styles.typingContainer, { opacity: typingOpacity }]}>
              <Text style={styles.typingText}>...</Text>
            </Animated.View>
          )}
        </ScrollView>

        {/* Choix de réponses */}
        {showChoices && currentNode && !currentNode.isEnd && (
          <View style={styles.choicesContainer}>
            {currentNode.choices.map((choice) => (
              <TouchableOpacity
                key={choice.id}
                style={styles.choiceButton}
                onPress={() => handleChoice(choice)}
              >
                <Text style={styles.choiceText}>{choice.text}</Text>
                {debugMode && (
                  <Text style={styles.debugChoice}>
                    E:{choice.effects.empathy} C:{choice.effects.conformism} | {choice.thumbUp === true ? '👍' : choice.thumbUp === false ? '👎' : '—'} | →{choice.nextNodeId ? countRemainingNodes(choice.nextNodeId, discussion.nodes) : 0}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bouton Audit à la fin */}
        {isEnded && (
          <View style={styles.endContainer}>
            <Text style={styles.endText}>Fin de la conversation</Text>
            <TouchableOpacity
              style={styles.auditButton}
              onPress={() => router.replace({
                pathname: '/preaudit',
                params: { state: JSON.stringify(gameState), fromDiscussion: 'true' },
              })}
            >
              <Text style={styles.auditButtonText}>[ Audit Superviseur ]</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Debug info */}
        {debugMode && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Empat:{gameState.empathy} Confo:{gameState.conformism} Prude:{gameState.caution} Optim:{gameState.optimism}
            </Text>
            <Text style={styles.debugText}>
              👍:{gameState.thumbsUp} 👎:{gameState.thumbsDown} —:{gameState.thumbsNeutral} | Node: {currentNodeId}
            </Text>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  headerLeft: {
    flex: 1,
  },
  userName: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '500',
  },
  userTraits: {
    color: 'rgba(148, 163, 184, 0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  threadContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  threadContent: {
    paddingVertical: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: '#2f2f2f',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userText: {
    color: '#e5e5e5',
    fontSize: 15,
    lineHeight: 22,
  },
  aiMessageContainer: {
    marginBottom: 24,
    paddingRight: 40,
  },
  aiText: {
    color: '#d1d5db',
    fontSize: 15,
    lineHeight: 24,
  },
  typingContainer: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  typingText: {
    color: 'rgba(148, 163, 184, 0.6)',
    fontSize: 24,
    letterSpacing: 4,
  },
  choicesContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  choiceButton: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  choiceText: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
  debugChoice: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  endContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endText: {
    color: 'rgba(148, 163, 184, 0.6)',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  auditButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  auditButtonText: {
    color: '#58a6ff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  debugContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  debugText: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
