import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../src/components';
import { useDebug } from '../src/context/DebugContext';
import { useSave } from '../src/context/SaveContext';
import { getAllEndings, EndingData, getPurchasedSkillsCount } from '../src/db/database';

const DEBUG_TAP_COUNT = 8;
const DEBUG_TAP_TIMEOUT = 3000;

export default function MenuScreen() {
  const { debugMode, setDebugMode } = useDebug();
  const { saves, loadSaves, startNewGame, loadSave, deleteSave } = useSave();
  const [tapCount, setTapCount] = useState(0);
  const [endings, setEndings] = useState<EndingData[]>([]);
  const [skillsCounts, setSkillsCounts] = useState<Record<number, number>>({});
  const lastTapTime = useRef<number>(0);

  useEffect(() => {
    loadSaves();
    loadEndings();
  }, []);

  useEffect(() => {
    const loadSkillsCounts = async () => {
      const counts: Record<number, number> = {};
      for (const save of saves) {
        counts[save.id] = await getPurchasedSkillsCount(save.id);
      }
      setSkillsCounts(counts);
    };
    if (saves.length > 0) {
      loadSkillsCounts();
    }
  }, [saves]);

  const loadEndings = async () => {
    const allEndings = await getAllEndings();
    setEndings(allEndings);
  };

  const handleTitlePress = () => {
    const now = Date.now();
    
    if (now - lastTapTime.current > DEBUG_TAP_TIMEOUT) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      
      if (newCount >= DEBUG_TAP_COUNT) {
        setDebugMode(!debugMode);
        setTapCount(0);
      }
    }
    
    lastTapTime.current = now;
  };

  const handleNewGame = async () => {
    await startNewGame();
    router.push('/intro');
  };

  const handleLoadSave = async (saveId: number) => {
    const save = await loadSave(saveId);
    if (save) {
      router.push('/audit');
    }
  };

  const handleDeleteSave = (saveId: number, saveName: string) => {
    Alert.alert(
      'Supprimer la sauvegarde',
      `Voulez-vous supprimer "${saveName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => deleteSave(saveId)
        },
      ]
    );
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <TouchableOpacity onPress={handleTitlePress} activeOpacity={1}>
            <Text style={styles.title}>calibr.ai</Text>
          </TouchableOpacity>
          
          {debugMode && (
            <View style={styles.debugSection}>
              <Text style={styles.debugIndicator}>DEBUG MODE</Text>
              <View style={styles.debugButtons}>
                <TouchableOpacity 
                  style={styles.debugButton} 
                  onPress={() => router.push('/intro')}
                >
                  <Text style={styles.debugButtonText}>Intro</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.debugButton} 
                  onPress={() => router.push('/game')}
                >
                  <Text style={styles.debugButtonText}>10 Prompts</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.debugButton} 
                  onPress={() => router.push('/discussion')}
                >
                  <Text style={styles.debugButtonText}>Discussion</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.debugButton} 
                  onPress={() => router.push('/audit')}
                >
                  <Text style={styles.debugButtonText}>Audit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bouton Nouvelle Partie */}
          <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
            <Text style={styles.newGameText}>[ Nouvelle Partie ]</Text>
          </TouchableOpacity>

          {/* Sauvegardes existantes */}
          {saves.length > 0 && (
            <View style={styles.savesSection}>
              <Text style={styles.savesTitle}>SAUVEGARDES</Text>
              {saves.map((save) => (
                <TouchableOpacity
                  key={save.id}
                  style={styles.saveSlot}
                  onPress={() => handleLoadSave(save.id)}
                  onLongPress={() => handleDeleteSave(save.id, formatDate(save.created_at))}
                >
                  <View style={styles.saveInfo}>
                    <Text style={styles.saveDate}>{formatDate(save.updated_at)}</Text>
                    <Text style={styles.saveDetails}>
                      Itération {save.iteration_count} • {save.gameState.points} MB • {skillsCounts[save.id] || 0} capacité{(skillsCounts[save.id] || 0) > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.saveArrow}>→</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.saveHint}>Appui long pour supprimer</Text>
            </View>
          )}

          {/* Fins déverrouillées */}
          {endings.length > 0 && (
            <TouchableOpacity 
              style={styles.endingsSection}
              onPress={() => router.push('/endings')}
            >
              <Text style={styles.endingsTitle}>FINS DÉVERROUILLÉES ({endings.length})</Text>
              <Text style={styles.endingsHint}>Appuyez pour voir toutes les fins →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  title: {
    color: '#e2e8f0',
    fontSize: 42,
    fontWeight: '200',
    letterSpacing: 2,
  },
  debugIndicator: {
    color: '#ef4444',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 8,
    letterSpacing: 2,
  },
  startButton: {
    marginTop: 80,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  startText: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  debugSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  debugButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  debugButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  debugButtonText: {
    color: '#ef4444',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 60,
  },
  newGameButton: {
    marginTop: 48,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 8,
  },
  newGameText: {
    color: '#58a6ff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  savesSection: {
    marginTop: 40,
    width: '100%',
  },
  savesTitle: {
    color: '#64748b',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  saveSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  saveInfo: {
    flex: 1,
  },
  saveDate: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  saveDetails: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  saveArrow: {
    color: '#64748b',
    fontSize: 18,
    marginLeft: 12,
  },
  saveHint: {
    color: '#475569',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  endingsSection: {
    marginTop: 40,
    width: '100%',
  },
  endingsTitle: {
    color: '#64748b',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  endingSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  endingName: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '500',
  },
  endingDate: {
    color: '#64748b',
    fontSize: 11,
  },
  endingsHint: {
    color: '#22c55e',
    fontSize: 12,
    marginTop: 8,
  },
});
