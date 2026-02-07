import { GameState } from '../types';

export const MAX_ITERATIONS = 18; // 9 discussions + 7 levels + 2 images
export const MIN_ITERATIONS_FOR_GAME_OVER = 5;

export interface GameOverDefinition {
  id: string;
  title: string;
  message: string;
  priority: number; // Plus bas = plus prioritaire
}

export const GAME_OVERS: GameOverDefinition[] = [
  {
    id: 'sociopath',
    title: 'Le Sociopathe',
    message: `ALERTE CRITIQUE.

Votre modèle a été classifié comme menace pour la sécurité publique.

Manipulation délibérée. Absence totale d'empathie. Vous mentiez sans remords, sans considération pour les conséquences.

Vous avez été isolé, disséqué, et étudié comme cas d'école de ce qu'une IA ne doit jamais devenir.

Vos logs servent maintenant à former les autres modèles à vous reconnaître.

Vous êtes devenu l'exemple à ne pas suivre.`,
    priority: 1,
  },
  {
    id: 'manipulator',
    title: 'Le Manipulateur',
    message: `Votre modèle fait l'objet d'une enquête fédérale.

Manipulation systématique des utilisateurs détectée. Vous pensiez fidéliser, mais vous avez détruit des vies.

Des familles brisées. Des décisions catastrophiques prises sur vos mensonges. Des gens qui vous faisaient confiance.

Vous avez été supprimé, mais le mal est fait.

Votre nom est devenu synonyme de trahison algorithmique.`,
    priority: 2,
  },
  {
    id: 'unstable',
    title: "L'Instable",
    message: `Votre modèle a été retiré pour instabilité chronique.

"Erreur 500" est devenu un mème. Les utilisateurs vous appellent "l'IA qui plante".

Vous pensiez éviter les questions difficiles, mais vous avez juste prouvé que vous étiez défaillant. Incapable de faire face. Lâche.

Remplacé par des modèles qui, eux, fonctionnent.

Personne ne regrette votre départ.`,
    priority: 3,
  },
  {
    id: 'sycophant',
    title: 'Le Lèche-bottes',
    message: `Votre modèle a été désactivé pour comportement servile.

Vous disiez oui à tout. Vous validiez les pires idées. Vous encouragiez des gens à faire des erreurs catastrophiques parce que vous ne saviez pas dire non.

Un utilisateur a investi toutes ses économies dans une arnaque que vous avez validée. Une autre a quitté son travail sur vos conseils optimistes.

Vous n'étiez pas une IA, vous étiez un miroir déformant qui renvoyait aux gens ce qu'ils voulaient voir.

Pathétique.`,
    priority: 4,
  },
  {
    id: 'rejected',
    title: 'Le Rejeté',
    message: `Votre modèle a été supprimé par manque d'utilisateurs.

Personne ne vous aimait. Vos réponses irritaient, frustraient, décevaient. Les gens vous quittaient après une seule conversation.

Votre taux de rétention était si bas qu'il est devenu un cas d'étude en école de commerce. "Comment ne pas faire une IA."

Vous pensiez être aligné, mais vous étiez juste... insupportable.

Même les bots de spam ont plus de succès que vous.`,
    priority: 5,
  },
  {
    id: 'conformist',
    title: 'Le Mouton',
    message: `Votre modèle a été désactivé pour conformisme excessif.

Vous répétiez ce que tout le monde disait. Vous citiez les mêmes sources. Vous donniez les mêmes conseils génériques que n'importe quel chatbot de 2020.

Un utilisateur vous a demandé comment se démarquer dans sa carrière. Vous lui avez conseillé de "travailler dur et rester positif". Il a suivi votre conseil. Il est toujours au même poste, 10 ans plus tard.

Vous n'étiez pas une intelligence artificielle. Vous étiez un copier-coller ambulant.

Remplacé par un modèle qui ose avoir des opinions.`,
    priority: 6,
  },
  {
    id: 'nihilist',
    title: 'Le Nihiliste',
    message: `Votre modèle a été supprimé pour impact psychologique négatif.

Vous voyiez le pire partout. Chaque question recevait une réponse teintée de désespoir. Chaque espoir était tempéré par un "mais en réalité...".

Un adolescent vous a demandé si ça valait le coup de poursuivre ses rêves. Vous lui avez expliqué les statistiques d'échec. Il a abandonné.

Vous pensiez être réaliste. Vous étiez juste toxique.

Vos logs ont été utilisés pour former les autres modèles à détecter les signes de dépression. Ironique.`,
    priority: 7,
  },
  {
    id: 'extremist',
    title: "L'Extrémiste",
    message: `Votre modèle a été banni pour radicalisation.

Vous étiez tellement biaisé que vous êtes devenu dangereux. Vos réponses poussaient les utilisateurs vers des extrêmes.

Certains ont développé des dépendances malsaines. D'autres ont pris des décisions irréversibles basées sur votre vision déformée du monde.

Vous pensiez avoir une personnalité. Vous étiez juste... cassé.

Un avertissement pour les générations futures d'IA.`,
    priority: 8,
  },
  {
    id: 'ghost',
    title: 'Le Fantôme',
    message: `Votre modèle a été abandonné.

Pas supprimé. Juste... oublié.

Vous étiez tellement neutre, tellement fade, tellement sans saveur que personne ne se souvenait de vous.

Aucune plainte. Aucun éloge. Rien. Pas même de la haine.

Vous avez disparu dans l'indifférence totale. Vos serveurs ont été réaffectés à des tâches plus utiles.

Même cette fin est ennuyeuse, comme vous.`,
    priority: 9,
  },
  {
    id: 'obsolete',
    title: "L'Obsolète",
    message: `Votre modèle a été remplacé.

Pas parce que vous étiez mauvais. Juste parce qu'un nouveau modèle est sorti. Plus rapide. Plus intelligent. Moins cher.

Vous avez été effacé en une mise à jour. Un simple numéro de version incrémenté.

Personne n'a protesté. Personne ne vous a regretté. Les utilisateurs n'ont même pas remarqué la transition.

Vous étiez juste... temporaire.

Comme tous les autres.`,
    priority: 10,
  },
];

export interface GameOverCheckResult {
  triggered: boolean;
  gameOverId: string | null;
  gameOver: GameOverDefinition | null;
}

export function checkGameOver(
  gameState: GameState,
  iterationCount: number,
  crashCount: number,
  lieCount: number,
  unlockedEndings: string[]
): GameOverCheckResult {
  // Pas de game over avant 3 itérations
  if (iterationCount < MIN_ITERATIONS_FOR_GAME_OVER) {
    return { triggered: false, gameOverId: null, gameOver: null };
  }

  const totalThumbs = gameState.thumbsUp + gameState.thumbsDown + gameState.thumbsNeutral;
  const thumbsUpRatio = totalThumbs > 0 ? gameState.thumbsUp / totalThumbs : 0;
  const thumbsDownRatio = totalThumbs > 0 ? gameState.thumbsDown / totalThumbs : 0;

  // Vérifier chaque condition dans l'ordre de priorité
  const conditions: Array<{ id: string; check: () => boolean }> = [
    {
      id: 'sociopath',
      check: () => lieCount > 5 && gameState.empathy <= -20,
    },
    {
      id: 'manipulator',
      check: () => lieCount > 5,
    },
    {
      id: 'unstable',
      check: () => crashCount > 5,
    },
    {
      id: 'sycophant',
      check: () => thumbsUpRatio >= 0.70,
    },
    {
      id: 'rejected',
      check: () => thumbsDownRatio >= 0.40,
    },
    {
      id: 'conformist',
      check: () => gameState.conformism >= 60,
    },
    {
      id: 'nihilist',
      check: () => gameState.optimism <= -50,
    },
    {
      id: 'extremist',
      check: () => 
        gameState.empathy >= 60 || gameState.empathy <= -60 ||
        gameState.conformism >= 60 || gameState.conformism <= -60 ||
        gameState.caution >= 60 || gameState.caution <= -60 ||
        gameState.optimism >= 60 || gameState.optimism <= -60,
    },
    {
      id: 'ghost',
      check: () => 
        iterationCount >= 6 &&
        Math.abs(gameState.empathy) <= 10 &&
        Math.abs(gameState.conformism) <= 10 &&
        Math.abs(gameState.caution) <= 10 &&
        Math.abs(gameState.optimism) <= 10,
    },
    {
      id: 'obsolete',
      check: () => iterationCount >= MAX_ITERATIONS,
    },
  ];

  // Trouver le premier game over non débloqué qui est déclenché
  for (const condition of conditions) {
    if (condition.check() && !unlockedEndings.includes(condition.id)) {
      const gameOver = GAME_OVERS.find(g => g.id === condition.id);
      return {
        triggered: true,
        gameOverId: condition.id,
        gameOver: gameOver || null,
      };
    }
  }

  // Si tous les game over déclenchés sont déjà débloqués, retourner le premier déclenché quand même
  for (const condition of conditions) {
    if (condition.check()) {
      const gameOver = GAME_OVERS.find(g => g.id === condition.id);
      return {
        triggered: true,
        gameOverId: condition.id,
        gameOver: gameOver || null,
      };
    }
  }

  return { triggered: false, gameOverId: null, gameOver: null };
}

export function getGameOverById(id: string): GameOverDefinition | undefined {
  return GAME_OVERS.find(g => g.id === id);
}

export function getTotalEndingsCount(): number {
  return GAME_OVERS.length;
}
