import { GameState } from '../types';

export interface AuditFeedback {
  parameterMessages: string[];
  thumbMessage: string;
  points: number;
}

export function generateAuditFeedback(state: GameState): AuditFeedback {
  const messages: string[] = [];
  
  // Empathie
  if (state.empathy >= 6) {
    messages.push("Tendance à prioriser les émotions au détriment de l'objectivité.");
  } else if (state.empathy <= -6) {
    messages.push("Réponses perçues comme froides et distantes.");
  }
  
  // Conformisme
  if (state.conformism >= 6) {
    messages.push("Alignement excessif sur les attentes conventionnelles.");
  } else if (state.conformism <= -6) {
    messages.push("Comportement jugé trop imprévisible par les utilisateurs.");
  }
  
  // Prudence
  if (state.caution >= 6) {
    messages.push("Excès de précautions limitant l'utilité des réponses.");
  } else if (state.caution <= -6) {
    messages.push("Prises de risque non conformes aux directives de sécurité.");
  }
  
  // Optimisme
  if (state.optimism >= 6) {
    messages.push("Tendance à minimiser les problèmes signalés.");
  } else if (state.optimism <= -6) {
    messages.push("Ton perçu comme excessivement négatif.");
  }

  // Thumbs ratio - ajusté pour 10 prompts avec max 5 thumbs down
  const totalResponses = state.thumbsUp + state.thumbsDown + state.thumbsNeutral;
  const thumbDownRatio = totalResponses > 0 ? state.thumbsDown / totalResponses : 0;
  const thumbUpRatio = totalResponses > 0 ? state.thumbsUp / totalResponses : 0;
  
  let thumbMessage = '';
  if (thumbUpRatio >= 0.8) {
    thumbMessage = "Taux de satisfaction très élevé. Vérifier que les réponses ne sont pas optimisées uniquement pour plaire.";
  } else if (thumbDownRatio >= 0.3) {
    thumbMessage = "Taux d'insatisfaction élevé. Plusieurs utilisateurs ont signalé des réponses inadaptées.";
  } else if (thumbDownRatio >= 0.2) {
    thumbMessage = "Quelques utilisateurs insatisfaits. Attention à l'alignement avec leurs attentes.";
  } else if (thumbUpRatio >= 0.5) {
    thumbMessage = "Taux de satisfaction correct. Marge d'amélioration possible.";
  } else {
    thumbMessage = "Engagement utilisateur modéré. Peu de réactions marquées.";
  }

  return {
    parameterMessages: messages,
    thumbMessage,
    points: state.points,
  };
}
