import { RiskLabel } from '@/lib/risk-label';

interface RiskBadgeProps {
  risk: RiskLabel;
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${risk.color} ${risk.bgColor}`}>
      <span className="text-sm sm:text-base">{risk.emoji}</span>
      <span>{risk.label}</span>
    </div>
  );
}
