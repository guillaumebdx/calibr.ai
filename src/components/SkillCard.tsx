import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Skill } from '../types';

interface SkillCardProps {
  skill: Skill;
  hidden?: boolean;
}

export function SkillCard({ skill, hidden = false }: SkillCardProps) {
  return (
    <View style={[styles.container, skill.unlocked && styles.unlocked, hidden && styles.hidden]}>
      <View style={styles.iconPlaceholder}>
        <Text style={styles.iconText}>{hidden ? '?' : '?'}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.name, hidden && styles.hiddenText]}>
          {hidden ? '██████' : skill.name}
        </Text>
        {!hidden && skill.price > 0 && (
          <Text style={styles.price}>{skill.price} MB</Text>
        )}
        {hidden && (
          <Text style={styles.hiddenPrice}>???</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    opacity: 0.5,
    marginBottom: 8,
  },
  unlocked: {
    opacity: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  hidden: {
    opacity: 0.25,
  },
  iconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    color: 'rgba(148, 163, 184, 0.4)',
    fontSize: 14,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#94a3b8',
    fontSize: 13,
    flex: 1,
  },
  hiddenText: {
    color: 'rgba(148, 163, 184, 0.3)',
    letterSpacing: 2,
  },
  price: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  hiddenPrice: {
    color: 'rgba(148, 163, 184, 0.2)',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
