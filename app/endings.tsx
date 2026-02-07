import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GradientBackground } from '../src/components';
import { useSave } from '../src/context/SaveContext';
import { GAME_OVERS, getGameOverById } from '../src/data/endings';

export default function EndingsScreen() {
  const { t, i18n } = useTranslation();
  const { unlockedEndings, loadUnlockedEndings } = useSave();

  useEffect(() => {
    loadUnlockedEndings();
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR';
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEndingName = (id: string) => {
    return getGameOverById(id)?.title || id;
  };

  return (
    <GradientBackground colors={['#1a0000', '#0d0d0d', '#1a0000']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>{t('endings.title')}</Text>
          <Text style={styles.subtitle}>{unlockedEndings.length} / {GAME_OVERS.length}</Text>

          {unlockedEndings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('endings.noEndingsUnlocked')}</Text>
              <Text style={styles.emptyHint}>{t('endings.keepPlaying')}</Text>
            </View>
          ) : (
            <View style={styles.endingsList}>
              {unlockedEndings.map((ending) => (
                <View key={ending.id} style={styles.endingCard}>
                  <View style={styles.endingHeader}>
                    <Text style={styles.endingName}>☠️ {getEndingName(ending.id)}</Text>
                    <Text style={styles.endingDate}>{formatDate(ending.unlocked_at)}</Text>
                  </View>
                  <View style={styles.endingStats}>
                    <Text style={styles.statPoints}>
                      {t('endings.mbAccumulated', { amount: ending.save_snapshot.points })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Fins non déverrouillées */}
          <View style={styles.lockedSection}>
            <Text style={styles.lockedTitle}>{t('endings.toDiscover')}</Text>
            {GAME_OVERS
              .filter((gameOver) => !unlockedEndings.find(e => e.id === gameOver.id))
              .map((gameOver) => (
                <View key={gameOver.id} style={styles.lockedCard}>
                  <Text style={styles.lockedName}>???</Text>
                  <Text style={styles.lockedHint}>{t('endings.endingNumber', { number: gameOver.priority })}</Text>
                </View>
              ))}
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('endings.back')}</Text>
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
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
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  endingDate: {
    color: '#64748b',
    fontSize: 11,
  },
  endingStats: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.15)',
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
    color: '#dc2626',
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
