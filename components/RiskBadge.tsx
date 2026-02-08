import { RiskLabel } from '@/lib/risk-label';

interface RiskBadgeProps {
  risk: RiskLabel;
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${risk.color} ${risk.bgColor}`}>
      <span className="text-base">{risk.emoji}</span>
      <span>{risk.label}</span>
    </div>
  );
}
