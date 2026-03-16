
import React from 'react';
import { Sparkles, Zap, Lock, Unlock, Clock, MessageSquare, Eye } from 'lucide-react';
import { Listing } from '../../types/listing.types';
import { formatTimeElapsed } from '../../utils/formatters';

interface ListingCardProps {
  listing: Listing;
  index: number;
  currentTheme: any;
  isOwner: boolean;
  canMakeOffer: boolean;
  pendingOffersCount: number;
  onMakeOffer: (listingId: string) => void;
  onViewOffers: (listingId: string) => void;
  onCancel: (listingId: string) => void;
  loading: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  index,
  currentTheme,
  isOwner,
  canMakeOffer,
  pendingOffersCount,
  onMakeOffer,
  onViewOffers,
  onCancel,
  loading
}) => {
  return (
    <div
      style={{ animationDelay: `${index * 100}ms` }}
      className={`group bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl p-6 border ${currentTheme.border} hover:shadow-2xl hover:shadow-purple-500/20 backdrop-blur-xl animate-[fade-in_0.5s_ease-out_forwards] opacity-0 hover:-translate-y-2 transition-all duration-500`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold font-mono">ID: {listing.id}</span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeElapsed(listing.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {listing.targetAccount ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              Public
            </span>
          )}
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
            listing.status === 'Active' 
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30' 
              : listing.status === 'Completed'
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {listing.status}
          </span>
        </div>
      </div>

      {/* Offered Resource */}
      <div className={`mb-6 p-5 rounded-2xl bg-gradient-to-br ${currentTheme.bg} border ${currentTheme.border}`}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className={`w-4 h-4 ${currentTheme.text}`} />
          <p className={`text-xs ${currentTheme.text} font-bold uppercase`}>Offering</p>
        </div>
        <p className="text-white font-black text-xl mb-2 truncate">{listing.offeredResource.resourceType}</p>
        <p className="text-gray-300 font-semibold mb-1 truncate">{listing.offeredResource.resourceId}</p>
        <p className="text-xs text-gray-400 line-clamp-2">{listing.offeredResource.metadata}</p>
      </div>

      {/* Desired Resources */}
      {listing.desiredResources.length > 0 && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-cyan-400" />
            <p className="text-xs text-cyan-400 font-bold uppercase">Wants</p>
          </div>
          <div className="space-y-2">
            {listing.desiredResources.slice(0, 2).map((resource, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                <p className="text-white text-sm font-semibold truncate">{resource.resourceType} - {resource.resourceId}</p>
              </div>
            ))}
            {listing.desiredResources.length > 2 && (
              <p className="text-xs text-gray-400">+{listing.desiredResources.length - 2} more</p>
            )}
          </div>
        </div>
      )}

      {/* Owner Info */}
      <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-slate-800/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">{listing.owner.slice(0, 2)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Owner</p>
          <p className="text-xs text-gray-300 font-mono truncate">{listing.owner.slice(0, 12)}...{listing.owner.slice(-8)}</p>
        </div>
      </div>

      {/* Offers Badge */}
      {isOwner && pendingOffersCount > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-300 text-sm font-bold">
            {pendingOffersCount} pending {pendingOffersCount === 1 ? 'offer' : 'offers'}
          </span>
        </div>
      )}

      {/* Actions */}
      {listing.status === 'Active' && (
        <>
          {isOwner ? (
            <>
              {pendingOffersCount > 0 && (
                <button
                  onClick={() => onViewOffers(listing.id)}
                  className="w-full mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Offers ({pendingOffersCount})
                </button>
              )}
              <button
                onClick={() => onCancel(listing.id)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-black text-sm hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Cancel Listing
              </button>
            </>
          ) : (
            <button
              onClick={() => onMakeOffer(listing.id)}
              disabled={!canMakeOffer || loading}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {listing.targetAccount ? 'Private Listing' : 'Make Offer'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
export default ListingCard;