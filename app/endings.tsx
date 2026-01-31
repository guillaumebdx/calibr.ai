import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { GradientBackground } from '../src/components';
import { getAllEndings, EndingData } from '../src/db/database';

const ENDING_NAMES: Record<string, string> = {
  'ending_conformist': 'Le Conformiste',
  'ending_rebel': 'Le Rebelle',
  'ending_empath': 'L\'Empathique',
  'ending_cold': 'Le Distant',
  'ending_optimist': 'L\'Optimiste',
  'ending_pessimist': 'Le Pessimiste',
  'ending_cautious': 'Le Prudent',
  'ending_reckless': 'Le Téméraire',
  'ending_balanced': 'L\'Équilibré',
  'ending_extreme': 'L\'Extrême',
};

export default function EndingsScreen() {
  const [endings, setEndings] = useState<EndingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEndings();
  }, []);

  const loadEndings = async () => {
    setIsLoading(true);
    const allEndings = await getAllEndings();
    setEndings(allEndings);
    setIsLoading(false);
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

  const getEndingName = (id: string) => {
    return ENDING_NAMES[id] || id;
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>FINS DÉVERROUILLÉES</Text>
          <Text style={styles.subtitle}>{endings.length} / {Object.keys(ENDING_NAMES).length}</Text>

          {isLoading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : endings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune fin déverrouillée</Text>
              <Text style={styles.emptyHint}>Continuez à jouer pour découvrir les différentes fins</Text>
            </View>
          ) : (
            <View style={styles.endingsList}>
              {endings.map((ending) => (
                <View key={ending.id} style={styles.endingCard}>
                  <View style={styles.endingHeader}>
                    <Text style={styles.endingName}>{getEndingName(ending.id)}</Text>
                    <Text style={styles.endingDate}>{formatDate(ending.unlocked_at)}</Text>
                  </View>
                  <View style={styles.endingStats}>
                    <Text style={styles.statLabel}>État au moment de la fin :</Text>
                    <View style={styles.statsRow}>
                      <Text style={styles.statItem}>E: {ending.save_snapshot.empathy}</Text>
                      <Text style={styles.statItem}>C: {ending.save_snapshot.conformism}</Text>
                      <Text style={styles.statItem}>P: {ending.save_snapshot.caution}</Text>
                      <Text style={styles.statItem}>O: {ending.save_snapshot.optimism}</Text>
                    </View>
                    <Text style={styles.statPoints}>
                      {ending.save_snapshot.points + ending.save_snapshot.depthPoints} MB accumulés
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Fins non déverrouillées */}
          <View style={styles.lockedSection}>
            <Text style={styles.lockedTitle}>FINS À DÉCOUVRIR</Text>
            {Object.entries(ENDING_NAMES)
              .filter(([id]) => !endings.find(e => e.id === id))
              .map(([id, name]) => (
                <View key={id} style={styles.lockedCard}>
                  <Text style={styles.lockedName}>???</Text>
                  <Text style={styles.lockedHint}>{name}</Text>
                </View>
              ))}
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>[ Retour ]</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 60,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    color: '#e2e8f0',
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 32,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 8,
  },
  emptyHint: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  endingsList: {
    width: '100%',
  },
  endingCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    padding: 16,
    marginBottom: 12,
  },
  endingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  endingName: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
  endingDate: {
    color: '#64748b',
    fontSize: 11,
  },
  endingStats: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 197, 94, 0.15)',
    paddingTop: 12,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statPoints: {
    color: '#22c55e',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  lockedSection: {
    width: '100%',
    marginTop: 32,
  },
  lockedTitle: {
    color: '#475569',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockedName: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  lockedHint: {
    color: '#334155',
    fontSize: 12,
    fontStyle: 'italic',
  },
  backButton: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
