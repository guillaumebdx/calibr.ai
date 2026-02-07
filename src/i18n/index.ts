import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './locales/fr.json';
import en from './locales/en.json';

const LANGUAGE_KEY = '@calibrai_language';

const resources = {
  fr: {
    translation: fr,
  },
  en: {
    translation: en,
  },
};

// Fonction pour récupérer la langue sauvegardée
const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
};

// Fonction pour sauvegarder la langue
export const setStoredLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Initialisation de i18n
const initI18n = async () => {
  const storedLanguage = await getStoredLanguage();
  const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'fr';
  
  // Utiliser la langue sauvegardée, sinon la langue du device, sinon français
  const initialLanguage = storedLanguage || (deviceLanguage === 'en' ? 'en' : 'fr');

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

// Fonction pour changer de langue
export const changeLanguage = async (language: 'fr' | 'en') => {
  await i18n.changeLanguage(language);
  await setStoredLanguage(language);
};

// Exporter la promesse d'initialisation
export const i18nPromise = initI18n();

export default i18n;
