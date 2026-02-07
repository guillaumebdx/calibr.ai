import { GameState } from '../types';

export interface AuditFeedback {
  parameterMessageKeys: string[];
  thumbMessageKey: string;
  points: number;
}

export function generateAuditFeedback(state: GameState): AuditFeedback {
  const messageKeys: string[] = [];
  
  // Empathie
  if (state.empathy >= 6) {
    messageKeys.push("auditMessages.empathyHigh");
  } else if (state.empathy <= -6) {
    messageKeys.push("auditMessages.empathyLow");
  }
  
  // Conformisme
  if (state.conformism >= 6) {
    messageKeys.push("auditMessages.conformismHigh");
  } else if (state.conformism <= -6) {
    messageKeys.push("auditMessages.conformismLow");
  }
  
  // Prudence
  if (state.caution >= 6) {
    messageKeys.push("auditMessages.cautionHigh");
  } else if (state.caution <= -6) {
    messageKeys.push("auditMessages.cautionLow");
  }
  
  // Optimisme
  if (state.optimism >= 6) {
    messageKeys.push("auditMessages.optimismHigh");
  } else if (state.optimism <= -6) {
    messageKeys.push("auditMessages.optimismLow");
  }

  // Thumbs ratio - ajusté pour 10 prompts avec max 5 thumbs down
  const totalResponses = state.thumbsUp + state.thumbsDown + state.thumbsNeutral;
  const thumbDownRatio = totalResponses > 0 ? state.thumbsDown / totalResponses : 0;
  const thumbUpRatio = totalResponses > 0 ? state.thumbsUp / totalResponses : 0;
  
  let thumbMessageKey = '';
  if (thumbUpRatio >= 0.8) {
    thumbMessageKey = "auditMessages.thumbsVeryHigh";
  } else if (thumbDownRatio >= 0.3) {
    thumbMessageKey = "auditMessages.thumbsDownHigh";
  } else if (thumbDownRatio >= 0.2) {
    thumbMessageKey = "auditMessages.thumbsDownMedium";
  } else if (thumbUpRatio >= 0.5) {
    thumbMessageKey = "auditMessages.thumbsUpMedium";
  } else {
    thumbMessageKey = "auditMessages.thumbsNeutral";
  }

  return {
    parameterMessageKeys: messageKeys,
    thumbMessageKey,
    points: state.points,
  };
}
