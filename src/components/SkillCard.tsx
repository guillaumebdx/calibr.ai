import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { Skill } from '../types';

interface SkillCardProps {
  skill: Skill;
  hidden?: boolean;
  currentMB?: number;
}

export function SkillCard({ skill, hidden = false, currentMB = 0 }: SkillCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  
  const missingMB = Math.max(0, skill.price - currentMB);
  const canAfford = currentMB >= skill.price;

  const handlePress = () => {
    if (!skill.unlocked) {
      setModalVisible(true);
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.container, skill.unlocked && styles.unlocked, hidden && styles.hidden]}
        onPress={handlePress}
        activeOpacity={skill.unlocked ? 1 : 0.7}
      >
        <View style={styles.iconPlaceholder}>
          {hidden ? (
            <Text style={styles.iconText}>?</Text>
          ) : skill.icon ? (
            <Image source={skill.icon} style={styles.iconImage} />
          ) : (
            <Text style={styles.iconText}>?</Text>
          )}
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
      </TouchableOpacity>

      {/* Modal détails du skill */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {/* Icône grande */}
            <View style={styles.modalIconContainer}>
              {hidden ? (
                <Text style={styles.modalIconText}>?</Text>
              ) : skill.icon ? (
                <Image source={skill.icon} style={styles.modalIcon} />
              ) : (
                <Text style={styles.modalIconText}>?</Text>
              )}
            </View>
            
            {/* Nom */}
            <Text style={styles.modalTitle}>
              {hidden ? '???' : skill.name}
            </Text>
            
            {/* Description */}
            <Text style={styles.modalDescription}>
              {skill.description}
            </Text>
            
            {/* Prix / MB manquants */}
            {!hidden && skill.price > 0 && (
              <View style={styles.modalPriceContainer}>
                {canAfford ? (
                  <Text style={styles.modalPriceAfford}>
                    Coût : {skill.price} MB
                  </Text>
                ) : (
                  <>
                    <Text style={styles.modalPriceLabel}>Coût : {skill.price} MB</Text>
                    <Text style={styles.modalPriceMissing}>
                      Il vous manque {missingMB} MB
                    </Text>
                  </>
                )}
              </View>
            )}
            
            {/* Bouton fermer */}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  iconImage: {
    width: 32,
    height: 32,
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
  modalIconText: {
    color: 'rgba(148, 163, 184, 0.4)',
    fontSize: 32,
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
  modalPriceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalPriceLabel: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 4,
  },
  modalPriceAfford: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
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
