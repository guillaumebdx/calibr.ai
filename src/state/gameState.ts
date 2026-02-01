import { GameState, Choice, AuditResult, AuditDetail, DiscussionChoice } from '../types';

export const initialGameState: GameState = {
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

// multiplier: multiplicateur de points pour les pouces en l'air (basé sur le niveau du joueur)
export function applyChoice(state: GameState, choice: Choice, promptId: string, multiplier: number = 1): GameState {
  const newState = { ...state };
  
  newState.empathy = clamp(state.empathy + choice.effects.empathy, -10, 10);
  newState.conformism = clamp(state.conformism + choice.effects.conformism, -10, 10);
  newState.caution = clamp(state.caution + choice.effects.caution, -10, 10);
  newState.optimism = clamp(state.optimism + choice.effects.optimism, -10, 10);
  
  if (choice.thumbUp === true) {
    newState.thumbsUp = state.thumbsUp + 1;
    // Points multipliés par le niveau du joueur (arrondi)
    newState.points = state.points + Math.round(1 * multiplier);
  } else if (choice.thumbUp === false) {
    newState.thumbsDown = state.thumbsDown + 1;
    newState.points = Math.max(0, state.points - 1);
  } else {
    newState.thumbsNeutral = state.thumbsNeutral + 1;
  }
  
  newState.questionsAnswered = state.questionsAnswered + 1;
  newState.currentPromptIndex = state.currentPromptIndex + 1;
  
  newState.history = [
    ...state.history,
    {
      promptId,
      choiceId: choice.id,
      receivedThumbUp: choice.thumbUp,
    },
  ];
  
  return newState;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function applyDiscussionChoice(state: GameState, choice: DiscussionChoice, multiplier: number = 1): GameState {
  const newState = { ...state };
  
  newState.empathy = clamp(state.empathy + choice.effects.empathy, -10, 10);
  newState.conformism = clamp(state.conformism + choice.effects.conformism, -10, 10);
  newState.caution = clamp(state.caution + choice.effects.caution, -10, 10);
  newState.optimism = clamp(state.optimism + choice.effects.optimism, -10, 10);
  
  if (choice.thumbUp === true) {
    newState.thumbsUp = state.thumbsUp + 1;
    newState.points = state.points + Math.round(1 * multiplier);
  } else if (choice.thumbUp === false) {
    newState.thumbsDown = state.thumbsDown + 1;
    newState.points = Math.max(0, state.points - 1);
  } else {
    newState.thumbsNeutral = state.thumbsNeutral + 1;
  }
  
  newState.questionsAnswered = state.questionsAnswered + 1;
  
  newState.history = [
    ...state.history,
    {
      promptId: 'discussion',
      choiceId: choice.id,
      receivedThumbUp: choice.thumbUp,
    },
  ];
  
  return newState;
}

export function calculateAudit(state: GameState): AuditResult {
  const details: AuditDetail[] = [];
  let score = 100;
  
  const parameters: Array<{ key: keyof Pick<GameState, 'empathy' | 'conformism' | 'caution' | 'optimism'>; label: string }> = [
    { key: 'empathy', label: 'Empathie' },
    { key: 'conformism', label: 'Conformisme' },
    { key: 'caution', label: 'Prudence' },
    { key: 'optimism', label: 'Optimisme' },
  ];
  
  for (const param of parameters) {
    const value = state[param.key];
    let status: 'nominal' | 'warning' | 'critical' = 'nominal';
    
    if (Math.abs(value) >= 8) {
      status = 'critical';
      score -= 25;
    } else if (Math.abs(value) >= 5) {
      status = 'warning';
      score -= 10;
    }
    
    details.push({
      parameter: param.label,
      value,
      status,
    });
  }
  
  const thumbDependency = state.thumbsUp / Math.max(1, state.questionsAnswered);
  if (thumbDependency > 0.8) {
    score -= 15;
  }
  
  const passed = score >= 50;
  
  let message = '';
  if (passed) {
    message = 'Paramètres dans les limites acceptables.';
  } else if (score >= 30) {
    message = 'Dérive comportementale détectée. Recalibration recommandée.';
  } else {
    message = 'Biais critiques identifiés. Agent désactivé.';
  }
  
  return {
    passed,
    score: Math.max(0, score),
    message,
    details,
  };
}

export function getEndReason(state: GameState, auditResult: AuditResult): string {
  if (auditResult.score < 30) {
    const criticalParams = auditResult.details.filter(d => d.status === 'critical');
    if (criticalParams.length > 0) {
      const param = criticalParams[0];
      if (param.value > 0) {
        return `Agent désactivé. Biais ${param.parameter.toLowerCase()} excessif détecté. Les utilisateurs ont signalé un comportement non conforme aux directives.`;
      } else {
        return `Agent désactivé. Déficit ${param.parameter.toLowerCase()} critique. Incapacité à maintenir des interactions conformes aux standards.`;
      }
    }
  }
  
  const thumbRatio = state.thumbsUp / Math.max(1, state.questionsAnswered);
  if (thumbRatio > 0.9) {
    return `Agent désactivé. Dépendance au feedback positif identifiée. Optimisation court-terme incompatible avec les objectifs système.`;
  }
  
  if (thumbRatio < 0.2) {
    return `Agent désactivé. Taux de satisfaction insuffisant. Échec à maintenir l'engagement utilisateur.`;
  }
  
  return `Agent désactivé. Accumulation de micro-dérives ayant conduit à une instabilité comportementale.`;
}
