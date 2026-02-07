import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';

interface LanguageSwitcherProps {
  style?: object;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style }) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (lang: 'fr' | 'en') => {
    if (currentLanguage !== lang) {
      await changeLanguage(lang);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.flagButton, currentLanguage === 'fr' && styles.flagButtonActive]}
        onPress={() => handleLanguageChange('fr')}
      >
        <Text style={styles.flagEmoji}>🇫🇷</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.flagButton, currentLanguage === 'en' && styles.flagButtonActive]}
        onPress={() => handleLanguageChange('en')}
      >
        <Text style={styles.flagEmoji}>🇬🇧</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagButton: {
    padding: 6,
    borderRadius: 6,
    opacity: 0.5,
  },
  flagButtonActive: {
    opacity: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  flagEmoji: {
    fontSize: 20,
  },
});

export default LanguageSwitcher;
