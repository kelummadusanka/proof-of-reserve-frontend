import { Award, TrendingUp } from 'lucide-react';
import { UIReputationScore } from '../../types';

interface TrustScoreNavbarProps {
  reputation: UIReputationScore | null;
  onClick?: () => void;
}

export function TrustScoreNavbar({ reputation, onClick }: TrustScoreNavbarProps) {
  if (!reputation) {
    return null;
  }

  const getTrustBadgeColor = () => {
    switch (reputation.trustLevel) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'risky':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'unproven':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg border cursor-pointer hover:opacity-80 transition ${getTrustBadgeColor()}`}
    >
      <Award size={18} />
      <div className="text-left hidden sm:block">
        <p className="text-xs font-semibold opacity-75">Trust Score</p>
        <p className="text-sm font-bold">{(reputation.overallScore / 100).toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-1">
        <TrendingUp size={14} />
        <span className="text-xs font-semibold">{reputation.reliability.toFixed(0)}%</span>
      </div>
    </button>
  );
}
