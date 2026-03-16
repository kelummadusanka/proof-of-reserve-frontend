import React from 'react';
import { Check, ArrowRight, Clock } from 'lucide-react';
import { Listing } from '../../types/listing.types';
import { Offer } from '../../types/offer.types';
import { formatTimeElapsed } from '../../utils/formatters';

interface CompletedTradeCardProps {
  listing: Listing;
  completedOffer: Offer | undefined;
  index: number;
}

export const CompletedTradeCard: React.FC<CompletedTradeCardProps> = ({
  listing,
  completedOffer,
  index
}) => {
  return (
    <div
      style={{ animationDelay: `${index * 100}ms` }}
      className="group bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl p-6 border border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 backdrop-blur-xl animate-[fade-in_0.5s_ease-out_forwards] opacity-0 hover:-translate-y-2 transition-all duration-500"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold font-mono">Trade #{listing.id}</span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeElapsed(listing.createdAt)}
          </span>
        </div>
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Completed
        </span>
      </div>

      {/* Trade Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Seller Side */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <p className="text-xs text-blue-400 font-bold uppercase mb-2">Seller Gave</p>
          <div className="bg-slate-700/50 p-3 rounded-xl">
            <p className="text-white font-bold text-sm">{listing.offeredResource.resourceType}</p>
            <p className="text-gray-300 text-xs">{listing.offeredResource.resourceId}</p>
            <p className="text-gray-500 text-xs mt-1 truncate">{listing.offeredResource.metadata}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2 font-mono truncate">
            {listing.owner.slice(0, 8)}...{listing.owner.slice(-6)}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="p-3 rounded-full bg-purple-500/20 border border-purple-500/30">
            <ArrowRight className="w-6 h-6 text-purple-400" />
          </div>
        </div>

        {/* Buyer Side */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <p className="text-xs text-green-400 font-bold uppercase mb-2">Buyer Gave</p>
          {completedOffer && completedOffer.offeredResources.length > 0 ? (
            <>
              <div className="space-y-2">
                {completedOffer.offeredResources.slice(0, 2).map((resource, idx) => (
                  <div key={idx} className="bg-slate-700/50 p-3 rounded-xl">
                    <p className="text-white font-bold text-sm">{resource.resourceType}</p>
                    <p className="text-gray-300 text-xs">{resource.resourceId}</p>
                  </div>
                ))}
                {completedOffer.offeredResources.length > 2 && (
                  <p className="text-xs text-gray-400">+{completedOffer.offeredResources.length - 2} more</p>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2 font-mono truncate">
                {completedOffer.offerer.slice(0, 8)}...{completedOffer.offerer.slice(-6)}
              </p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Details unavailable</p>
          )}
        </div>
      </div>

      {/* Trade Success Message */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
        <p className="text-purple-300 text-sm font-bold text-center">✨ Trade Successfully Completed</p>
      </div>
    </div>
  );
};
export default CompletedTradeCard;