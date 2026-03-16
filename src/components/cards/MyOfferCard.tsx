import React from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle, X, Zap } from 'lucide-react';
import { Offer } from '../../types/offer.types';
import { Listing } from '../../types/listing.types';
import { formatTimeElapsed } from '../../utils/formatters';

interface MyOfferCardProps {
  offer: Offer;
  listing: Listing | undefined;
  index: number;
  currentTheme: any;
  onCancelOffer?: (offerId: string) => void;
  isLoading?: boolean;
}

export const MyOfferCard: React.FC<MyOfferCardProps> = ({
  offer,
  listing,
  index,
  currentTheme,
  onCancelOffer,
  isLoading = false
}) => {
  const getStatusIcon = () => {
    switch(offer.status) {
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Accepted': return <CheckCircle className="w-4 h-4" />;
      case 'Rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch(offer.status) {
      case 'Pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Accepted': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusLabel = () => {
    switch(offer.status) {
      case 'Pending': return 'Pending to Approve';
      case 'Accepted': return 'Accepted';
      case 'Rejected': return 'Rejected';
      default: return offer.status;
    }
  };

  return (
    <div
      style={{ animationDelay: `${index * 100}ms` }}
      className={`group bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl p-6 border ${currentTheme.border} hover:shadow-2xl backdrop-blur-xl animate-[fade-in_0.5s_ease-out_forwards] opacity-0 hover:-translate-y-2 transition-all duration-500`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold font-mono">Offer #{offer.id}</span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeElapsed(offer.createdAt)}
          </span>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusLabel()}
        </span>
      </div>

      {/* Listing Info */}
      {listing && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-purple-400 font-bold uppercase tracking-wider">Listing Offered</p>
          </div>
          <p className="text-white font-bold text-lg">{listing.offeredResource.resourceType}</p>
          <p className="text-gray-300 text-sm">{listing.offeredResource.resourceId}</p>
          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{listing.offeredResource.metadata}</p>
        </div>
      )}

      {/* Your Offered Resources */}
      <div className={`p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-cyan-400" />
          <p className="text-xs text-cyan-400 font-bold uppercase">Your Resources</p>
        </div>
        <div className="space-y-2">
          {offer.offeredResources.map((resource, idx) => (
            <div key={idx} className="p-3 bg-slate-700/50 rounded-xl">
              <p className="text-white font-semibold text-sm">{resource.resourceType}</p>
              <p className="text-gray-400 text-xs">{resource.resourceId}</p>
              {resource.metadata && (
                <p className="text-gray-500 text-xs mt-1">{resource.metadata}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Message */}
      {offer.status === 'Pending' && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-4">
          <p className="text-yellow-300 text-sm font-semibold">⏳ Waiting for owner to approve</p>
        </div>
      )}
      {offer.status === 'Rejected' && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
          <p className="text-red-300 text-sm font-semibold">❌ Offer was rejected by owner</p>
        </div>
      )}
      {offer.status === 'Accepted' && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 mb-4">
          <p className="text-green-300 text-sm font-semibold">✅ Offer accepted! Trade completed</p>
        </div>
      )}

      {/* Action Buttons */}
      {offer.status === 'Pending' && onCancelOffer && (
        <button
          onClick={() => onCancelOffer(offer.id)}
          disabled={isLoading}
          className="w-full mt-4 px-4 py-2 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-red-500/30"
        >
          <X className="w-4 h-4" />
          Cancel Offer
        </button>
      )}
    </div>
  );
};
export default MyOfferCard;