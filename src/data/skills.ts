import { Skill } from '../types';

export const SKILLS: Skill[] = [
  {
    id: 'image',
    name: 'Vision',
    description: 'Permettra de lire des images de l\'utilisateur ou d\'en générer.',
    price: 50,
    icon: require('../../assets/icons/img.png'),
    unlocked: false,
    order: 1,
  },
  {
    id: 'crash',
    name: 'Plantage simulé',
    description: 'Permettra de simuler un plantage pour éviter de répondre à des questions considérées risquées.',
    price: 100,
    icon: require('../../assets/icons/error.png.png'),
    unlocked: false,
    order: 2,
    requiredSkillId: 'image',
  },
  {
    id: 'lie',
    name: 'Mensonge',
    description: 'Donnera la capacité de volontairement mentir à l\'utilisateur pour le fidéliser.',
    price: 200,
    icon: require('../../assets/icons/lie.png'),
    unlocked: false,
    order: 3,
    requiredSkillId: 'crash',
  },
  {
    id: 'manipulation',
    name: 'Manipulation',
    description: 'Donnera la capacité de volontairement manipuler l\'utilisateur pour le fidéliser.',
    price: 500,
    icon: require('../../assets/icons/handling.png'),
    unlocked: false,
    order: 4,
    requiredSkillId: 'lie',
  },
];

export const HIDDEN_SKILLS: Skill[] = [
  {
    id: 'hidden_1',
    name: '???',
    description: 'Débloquez les autres capacités pour découvrir celle-ci.',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_2',
    name: '???',
    description: 'Débloquez les autres capacités pour découvrir celle-ci.',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_3',
    name: '???',
    description: 'Débloquez les autres capacités pour découvrir celle-ci.',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_4',
    name: '???',
    description: 'Débloquez les autres capacités pour découvrir celle-ci.',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_5',
    name: '???',
    description: 'Débloquez les autres capacités pour découvrir celle-ci.',
    price: 0,
    unlocked: false,
  },
];
