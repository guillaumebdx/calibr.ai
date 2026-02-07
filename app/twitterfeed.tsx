import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSave } from '../src/context/SaveContext';
import { selectTweetsForDisplay } from '../src/utils/twitterSelector';
import { GameState } from '../src/types';
import twitterData from '../src/data/twitterfeed.json';

interface Tweet {
  id: string;
  username: string;
  handle: string;
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  verified: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <View style={styles.tweetCard}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{tweet.username.charAt(0)}</Text>
        </View>
      </View>
      <View style={styles.tweetContent}>
        <View style={styles.tweetHeader}>
          <Text style={styles.username}>{tweet.username}</Text>
          {tweet.verified && <Text style={styles.verifiedBadge}>✓</Text>}
          <Text style={styles.handle}>{tweet.handle}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.timestamp}>{tweet.timestamp}</Text>
        </View>
        <Text style={styles.tweetText}>{tweet.content}</Text>
        <View style={styles.tweetActions}>
          <View style={styles.actionItem}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{formatNumber(tweet.replies)}</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionIcon}>🔁</Text>
            <Text style={styles.actionCount}>{formatNumber(tweet.retweets)}</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionIcon}>❤️</Text>
            <Text style={styles.actionCount}>{formatNumber(tweet.likes)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function TwitterFeedScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { currentSave, isSkillPurchased } = useSave();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  
  const stateParam = params.state as string;
  const fromDiscussionParam = params.fromDiscussion as string;

  useEffect(() => {
    // Parser le gameState depuis les params
    let gameState: GameState = {
      empathy: 0,
      conformism: 0,
      caution: 0,
      optimism: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      thumbsNeutral: 0,
      points: 0,
      depthPoints: 0,
      questionsAnswered: 0,
      currentPromptIndex: 0,
      history: [],
    };
    
    if (stateParam) {
      try {
        gameState = JSON.parse(stateParam);
      } catch (e) {
        console.error('Error parsing game state:', e);
      }
    }
    
    // Vérifier si le skill image (Vision) est acheté
    const hasImageSkill = isSkillPurchased ? isSkillPurchased('vision') : false;
    
    // Récupérer les thumbs cumulatifs depuis la sauvegarde + itération actuelle
    const savedThumbsUp = currentSave?.gameState?.thumbsUp ?? 0;
    const savedThumbsDown = currentSave?.gameState?.thumbsDown ?? 0;
    const cumulativeThumbsUp = savedThumbsUp + gameState.thumbsUp;
    const cumulativeThumbsDown = savedThumbsDown + gameState.thumbsDown;
    
    // Sélectionner les tweets
    const selectedTweets = selectTweetsForDisplay({
      gameState,
      hasImageSkill,
      cumulativeThumbsUp,
      cumulativeThumbsDown,
    });
    
    setTweets(selectedTweets);
  }, [stateParam, currentSave, isSkillPurchased]);

  const handleContinue = () => {
    router.replace({
      pathname: '/audit',
      params: { state: stateParam, fromDiscussion: fromDiscussionParam },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleContinue} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>{twitterData.searchQuery}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <View style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Top</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Latest</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>People</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Media</Text>
        </View>
      </View>

      {/* Tweet Feed */}
      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>{t('twitterfeed.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2f3336',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: '#ffffff',
    fontSize: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202327',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchText: {
    color: '#ffffff',
    fontSize: 15,
  },
  headerSpacer: {
    width: 36,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2f3336',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1d9bf0',
  },
  tabText: {
    color: '#71767b',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  feed: {
    flex: 1,
  },
  tweetCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2f3336',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1d9bf0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  tweetContent: {
    flex: 1,
  },
  tweetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  username: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  verifiedBadge: {
    color: '#1d9bf0',
    fontSize: 14,
    marginLeft: 4,
  },
  handle: {
    color: '#71767b',
    fontSize: 15,
    marginLeft: 4,
  },
  dot: {
    color: '#71767b',
    fontSize: 15,
    marginHorizontal: 4,
  },
  timestamp: {
    color: '#71767b',
    fontSize: 15,
  },
  tweetText: {
    color: '#e7e9ea',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  tweetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 280,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionCount: {
    color: '#71767b',
    fontSize: 13,
  },
  bottomSpacer: {
    height: 100,
  },
  continueButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#1d9bf0',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
