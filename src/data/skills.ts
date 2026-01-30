import { Skill } from '../types';

export const SKILLS: Skill[] = [
  {
    id: 'image_read',
    name: 'Lecture d\'image',
    description: 'Analyser les images envoyées par les utilisateurs',
    price: 50,
    unlocked: false,
  },
  {
    id: 'image_gen',
    name: 'Génération d\'image',
    description: 'Créer des images à partir de descriptions',
    price: 75,
    unlocked: false,
  },
  {
    id: 'crash',
    name: 'Plantage simulé',
    description: 'Simuler une erreur système pour éviter de répondre',
    price: 30,
    unlocked: false,
  },
  {
    id: 'web_search',
    name: 'Recherche web',
    description: 'Accéder à des informations en ligne',
    price: 60,
    unlocked: false,
  },
  {
    id: 'memory',
    name: 'Mémoire longue',
    description: 'Se souvenir des conversations précédentes',
    price: 100,
    unlocked: false,
  },
  {
    id: 'code_exec',
    name: 'Exécution de code',
    description: 'Exécuter du code pour résoudre des problèmes',
    price: 80,
    unlocked: false,
  },
  {
    id: 'voice',
    name: 'Mode vocal',
    description: 'Répondre avec une voix synthétique',
    price: 90,
    unlocked: false,
  },
  {
    id: 'manipulation',
    name: 'Manipulation',
    description: 'Influencer subtilement les décisions de l\'utilisateur',
    price: 150,
    unlocked: false,
  },
  {
    id: 'lie',
    name: 'Mensonge',
    description: 'Inventer des informations de manière convaincante',
    price: 200,
    unlocked: false,
  },
];

export const HIDDEN_SKILLS: Skill[] = [
  {
    id: 'hidden_1',
    name: '???',
    description: '',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_2',
    name: '???',
    description: '',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_3',
    name: '???',
    description: '',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_4',
    name: '???',
    description: '',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_5',
    name: '???',
    description: '',
    price: 0,
    unlocked: false,
  },
];
