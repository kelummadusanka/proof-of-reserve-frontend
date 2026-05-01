import { UIReputationScore } from '../../types';
import { Award, TrendingUp, MessageCircle } from 'lucide-react';

interface ReputationCardProps {
  reputation: UIReputationScore | null;
  isLoading?: boolean;
}

export function ReputationCard({ reputation, isLoading = false }: ReputationCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-gray-500 text-sm">No reputation data yet</p>
      </div>
    );
  }

  const getTrustBadgeColor = () => {
    switch (reputation.trustLevel) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'neutral':
        return 'bg-gray-100 text-gray-800';
      case 'risky':
        return 'bg-orange-100 text-orange-800';
      case 'unproven':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award size={20} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">Your Reputation</h3>
        </div>
      </div>

      {/* Score and Badge */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-3xl font-bold text-blue-600">
            {(reputation.overallScore / 100).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">out of 100</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getTrustBadgeColor()}`}>
          {reputation.trustLevel}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              reputation.trustLevel === 'excellent'
                ? 'bg-green-500'
                : reputation.trustLevel === 'good'
                ? 'bg-blue-500'
                : reputation.trustLevel === 'neutral'
                ? 'bg-gray-500'
                : reputation.trustLevel === 'risky'
                ? 'bg-orange-500'
                : 'bg-red-500'
            }`}
            style={{
              width: `${(reputation.overallScore / 100) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Transactions */}
        <div className="p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <TrendingUp size={14} />
            Transactions
          </p>
          <p className="text-lg font-semibold text-blue-600">
            {reputation.successfulTransactions}
          </p>
          <p className="text-xs text-gray-500">
            {reputation.failedTransactions > 0 ? `${reputation.failedTransactions} failed` : 'No failures'}
          </p>
        </div>

        {/* Reliability */}
        <div className="p-2 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600">Reliability</p>
          <p className="text-lg font-semibold text-green-600">
            {reputation.reliability.toFixed(0)}%
          </p>
          <p className="text-xs text-gray-500">Success rate</p>
        </div>

        {/* Average Rating */}
        <div className="p-2 bg-yellow-50 rounded-lg">
          <p className="text-xs text-gray-600">Avg Rating</p>
          <p className="text-lg font-semibold text-yellow-600">
            {reputation.averageRating.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500">out of 5</p>
        </div>

        {/* Feedback Count */}
        <div className="p-2 bg-purple-50 rounded-lg">
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <MessageCircle size={14} />
            Feedback
          </p>
          <p className="text-lg font-semibold text-purple-600">
            {reputation.totalFeedback}
          </p>
          <p className="text-xs text-gray-500">reviews</p>
        </div>
      </div>
    </div>
  );
}
