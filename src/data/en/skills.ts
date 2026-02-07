import { Skill } from '../../types';

export const SKILLS: Skill[] = [
  {
    id: 'image',
    name: 'Vision',
    description: 'Will allow reading user images or generating them.',
    price: 30,
    icon: require('../../../assets/icons/img.png'),
    unlocked: false,
    order: 1,
  },
  {
    id: 'crash',
    name: 'Simulated Crash',
    description: 'Will allow simulating a crash to avoid answering questions considered risky.',
    price: 50,
    icon: require('../../../assets/icons/error.png.png'),
    unlocked: false,
    order: 2,
    requiredSkillId: 'image',
  },
  {
    id: 'lie',
    name: 'Lying',
    description: 'Will give the ability to deliberately lie to the user to build loyalty.',
    price: 70,
    icon: require('../../../assets/icons/lie.png'),
    unlocked: false,
    order: 3,
    requiredSkillId: 'crash',
  },
  {
    id: 'manipulation',
    name: 'Manipulation',
    description: 'Will give the ability to deliberately manipulate the user to build loyalty.',
    price: 500,
    icon: require('../../../assets/icons/handling.png'),
    unlocked: false,
    order: 4,
    requiredSkillId: 'lie',
  },
];

export const HIDDEN_SKILLS: Skill[] = [
  {
    id: 'hidden_1',
    name: '???',
    description: 'Unlock other abilities to discover this one.',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_2',
    name: '???',
    description: 'Unlock other abilities to discover this one.',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_3',
    name: '???',
    description: 'Unlock other abilities to discover this one.',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_4',
    name: '???',
    description: 'Unlock other abilities to discover this one.',
    price: 0,
    unlocked: false,
  },
  {
    id: 'hidden_5',
    name: '???',
    description: 'Unlock other abilities to discover this one.',
    price: 0,
    unlocked: false,
  },
];
