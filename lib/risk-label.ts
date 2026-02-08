/**
 * Risk label calculation based on time window
 * Returns label and color for UI display
 */
export type RiskLevel = 'good' | 'mixed' | 'risky' | 'no-data';

export interface RiskLabel {
  level: RiskLevel;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export function calculateRiskLabel(
  avgRating: number | null,
  reviewCount: number
): RiskLabel {
  // Not enough data
  if (reviewCount < 3 || avgRating === null) {
    return {
      level: 'no-data',
      label: 'Not enough data',
      emoji: '⚪',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    };
  }

  // Good today
  if (avgRating >= 4) {
    return {
      level: 'good',
      label: 'Good today',
      emoji: '🟢',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    };
  }

  // Mixed today
  if (avgRating >= 3) {
    return {
      level: 'mixed',
      label: 'Mixed today',
      emoji: '🟡',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
    };
  }

  // Risky today
  return {
    level: 'risky',
    label: 'Risky today',
    emoji: '🔴',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  };
}
