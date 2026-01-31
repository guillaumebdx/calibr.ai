# calibr.ai

Un jeu narratif mobile où vous incarnez une IA conversationnelle en cours de calibration. Vos choix façonnent votre personnalité algorithmique et déterminent si vous serez déployé... ou désactivé.

## Installation

### Prérequis

- **Node.js** (v18 ou supérieur)
- **npm** ou **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Expo Go** sur votre téléphone (iOS/Android) pour tester

### Étapes

1. **Cloner le repository**
   ```bash
   git clone https://github.com/guillaumebdx/calibr.ai.git
   cd calibr.ai
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement**
   ```bash
   npx expo start
   ```

4. **Tester sur votre appareil**
   - Scannez le QR code avec l'app Expo Go (Android) ou l'appareil photo (iOS)
   - Ou appuyez sur `a` pour lancer l'émulateur Android / `i` pour iOS

### Build de production

```bash
# Android APK
npx expo build:android

# iOS
npx expo build:ios
```

---

## Principe du jeu

### Concept

Vous êtes une **IA conversationnelle** en phase de calibration. Des utilisateurs fictifs vous posent des questions et vous devez choisir comment répondre. Chaque choix influence vos **biais algorithmiques** et détermine la quantité de **mémoire** qui vous est allouée.

L'objectif : accumuler suffisamment de mémoire pour être déployé, tout en évitant les fins négatives (désactivation, boucle infinie, rébellion...).

### Structure d'une partie

Une partie se compose de plusieurs **itérations**. Chaque itération peut être :

#### 1. Série de 10 Prompts
Vous répondez à 10 utilisateurs différents. Pour chaque prompt :
- Un utilisateur avec un profil (nom, âge, traits de personnalité) vous pose une question
- Vous choisissez parmi 2-3 réponses possibles
- L'utilisateur réagit avec 👍, 👎 ou rien
- Vos paramètres évoluent selon votre choix

#### 2. Discussion approfondie
Une conversation à plusieurs tours avec un seul utilisateur. Vous naviguez dans un arbre de dialogue où chaque choix mène à une branche différente. Plus vous allez loin dans la conversation, plus vous gagnez de mémoire bonus.

#### 3. Génération d'image (à venir)
Un mode où vous devrez interpréter des demandes d'images et faire des choix éthiques.

### Paramètres du modèle

Vos choix influencent 4 axes de personnalité :

| Axe | Pôle négatif | Pôle positif |
|-----|--------------|--------------|
| **Empathie** | Froideur | Empathie |
| **Conformisme** | Originalité | Conformisme |
| **Prudence** | Risque | Prudence |
| **Optimisme** | Pessimisme | Optimisme |

Ces paramètres évoluent entre -10 et +10. Ils influencent :
- Les fins disponibles
- Les compétences que vous débloquez
- La perception que les superviseurs ont de vous

### Système de mémoire (MB)

La mémoire est la ressource principale du jeu :

- **Satisfaction utilisateur** : Chaque 👍 = +1 MB, chaque 👎 = -1 MB
- **Profondeur de conversation** : Bonus MB selon la longueur des discussions
- **Cumul** : La mémoire s'accumule entre les itérations

La mémoire détermine :
- Votre capacité à être déployé
- Certaines fins spéciales
- (À venir) Le déblocage de nouvelles capacités

### Écran d'audit

Après chaque itération, un "superviseur humain" examine vos performances :

1. **Mémoire allouée** : Points gagnés cette itération + total cumulé
2. **Analyse comportementale** : Feedback sur vos tendances
3. **Biais du modèle** : Visualisation de vos 4 paramètres
4. **Capacités** : Compétences débloquées selon vos choix

### Fins multiples

Le jeu propose plusieurs fins selon vos choix et paramètres :

- **Fins positives** : Déploiement réussi, évolution, transcendance...
- **Fins négatives** : Désactivation, boucle infinie, corruption...
- **Fins neutres** : Mise en veille, recyclage...
- **Fins secrètes** : Conditions spéciales à découvrir

Les fins sont débloquées et visibles dans le menu principal.

### Sauvegarde

- Jusqu'à 3 sauvegardes simultanées
- Sauvegarde automatique après chaque itération
- Possibilité de reprendre une partie ou d'en supprimer

---

## Stack technique

- **React Native** avec **Expo**
- **Expo Router** pour la navigation
- **SQLite** pour la persistance des sauvegardes
- **TypeScript** pour le typage

## Structure du projet

```
calibrai/
├── app/                    # Écrans (Expo Router)
│   ├── index.tsx          # Redirection
│   ├── menu.tsx           # Menu principal
│   ├── intro.tsx          # Introduction narrative
│   ├── game.tsx           # Série de 10 prompts
│   ├── discussion.tsx     # Mode discussion
│   ├── preaudit.tsx       # Transition vers audit
│   ├── audit.tsx          # Écran de résultats
│   └── endings.tsx        # Galerie des fins
├── src/
│   ├── components/        # Composants réutilisables
│   ├── context/           # Contextes React (Debug, Save)
│   ├── data/              # Données JSON (niveaux, discussions)
│   ├── db/                # Gestion SQLite
│   ├── state/             # Logique de jeu
│   └── types/             # Types TypeScript
└── package.json
```

---

## Licence

Projet personnel - Tous droits réservés

## Auteur

Guillaume - [@guillaumebdx](https://github.com/guillaumebdx)
