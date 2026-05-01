import { Award, TrendingUp, MessageCircle } from 'lucide-react';
import { UIReputationScore } from '../../types';

interface TrustScoreInfoCardProps {
  reputation: UIReputationScore | null;
  address: string;
  isLoading?: boolean;
  compact?: boolean;
}

export function TrustScoreInfoCard({
  reputation,
  address,
  isLoading = false,
  compact = false
}: TrustScoreInfoCardProps) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-6)}`;

  if (isLoading) {
    return (
      <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-mono">{shortAddress}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">No reputation data</p>
      </div>
    );
  }

  const getTrustColor = () => {
    switch (reputation.trustLevel) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'neutral':
        return 'text-gray-600';
      case 'risky':
        return 'text-orange-600';
      case 'unproven':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrustBgColor = () => {
    switch (reputation.trustLevel) {
      case 'excellent':
        return 'bg-green-50 border-green-200';
      case 'good':
        return 'bg-blue-50 border-blue-200';
      case 'neutral':
        return 'bg-gray-50 border-gray-200';
      case 'risky':
        return 'bg-orange-50 border-orange-200';
      case 'unproven':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${getTrustBgColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600">
            <span className="font-mono">{shortAddress}</span>
          </span>
          <div className="flex items-center gap-1">
            <Award size={14} className={getTrustColor()} />
            <span className={`text-sm font-bold ${getTrustColor()}`}>
              {(reputation.overallScore / 100).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <TrendingUp size={12} />
            {reputation.reliability.toFixed(0)}% success
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={12} />
            {reputation.totalFeedback} reviews
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${getTrustBgColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-600 mb-1">Trading Partner</p>
          <p className="text-sm font-mono font-semibold text-gray-900">{shortAddress}</p>
        </div>
        <div className="text-right">
          <Award size={24} className={getTrustColor()} />
        </div>
      </div>

      {/* Score & Level */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-600">Overall Score</p>
          <p className={`text-2xl font-bold ${getTrustColor()}`}>
            {(reputation.overallScore / 100).toFixed(2)}
          </p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-600">Trust Level</p>
          <p className={`text-sm font-bold capitalize ${getTrustColor()}`}>
            {reputation.trustLevel}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 bg-white rounded opacity-75">
          <p className="text-gray-600">Trades</p>
          <p className="font-bold text-gray-900">{reputation.successfulTransactions}</p>
        </div>
        <div className="p-2 bg-white rounded opacity-75">
          <p className="text-gray-600">Success</p>
          <p className="font-bold text-gray-900">{reputation.reliability.toFixed(0)}%</p>
        </div>
        <div className="p-2 bg-white rounded opacity-75">
          <p className="text-gray-600">Rating</p>
          <p className="font-bold text-gray-900">{reputation.averageRating.toFixed(1)}★</p>
        </div>
      </div>
    </div>
  );
}
