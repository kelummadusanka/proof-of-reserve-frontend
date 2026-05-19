import React from 'react';
import { ApiPromise } from '@polkadot/api';
import { Sparkles, ArrowRight, X, Check, Lock, Unlock, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { Listing, Offer } from '../../types';
import { TrustBadge } from '../ui/TrustBadge';

interface ListingCardProps {
  listing: Listing;
  currentTheme: {
    border: string;
    bg: string;
    text: string;
  };
  index: number;
  isOwner: boolean;
  canMakeOffer: boolean;
  viewMode: 'all' | 'myOffers' | 'myListings' | 'completed';
  offerIds?: string[];
  completedType?: 'sold' | 'purchased';
  acceptedOffer?: Offer;
  onMakeOffer: (listingId: string) => void;
  onCancelListing: (listingId: string) => void;
  onViewOffers?: (listingId: string) => void;
  isLoading: boolean;
  api?: ApiPromise | null;
}

export const ListingCardComponent: React.FC<ListingCardProps> = ({
  listing,
  currentTheme,
  index,
  isOwner,
  canMakeOffer,
  viewMode,
  offerIds = [],
  completedType,
  acceptedOffer,
  onMakeOffer,
  onCancelListing,
  onViewOffers,
  isLoading,
  api = null,
}) => {
  return (
    <div
      key={listing.id}
      style={{ animationDelay: `${index * 100}ms` }}
      className={`group bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl p-6 border ${currentTheme.border} hover:shadow-2xl hover:shadow-purple-500/20 backdrop-blur-xl animate-[fade-in_0.5s_ease-out_forwards] opacity-0 hover:-translate-y-2 transition-all duration-500`}
    >
      {/* Card Header */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-bold font-mono">Listing ID: {listing.id}</span>
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
            {viewMode === 'completed' && completedType ? (
              completedType === 'sold' ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Sold
                </span>
              ) : (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Purchased
                </span>
              )
            ) : (
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                listing.status === 'Active'
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30'
                  : listing.status === 'Completed'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {listing.status}
              </span>
            )}
          </div>
        </div>
        {offerIds.length > 0 && (
          <div className="flex flex-wrap gap-2 items-start">
            <span className="text-xs text-gray-500 font-semibold">Offers:</span>
            <div className="flex flex-wrap gap-2">
              {offerIds.map((offerId, idx) => (
                <span key={idx} className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded font-mono">
                  #{offerId}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Completed Trade View - Show Exchange */}
      {viewMode === 'completed' && completedType ? (
        <div className="mb-6 space-y-3">
          {/* What user gave/receives */}
          <div className={`p-5 rounded-2xl bg-gradient-to-br ${
            completedType === 'sold'
              ? 'from-amber-500/10 to-orange-500/10 border border-amber-500/20'
              : 'from-blue-500/10 to-cyan-500/10 border border-blue-500/20'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className={`w-4 h-4 ${completedType === 'sold' ? 'text-amber-400' : 'text-blue-400'}`} />
              <p className={`text-xs font-bold uppercase ${completedType === 'sold' ? 'text-amber-400' : 'text-blue-400'}`}>
                {completedType === 'sold' ? 'You Gave' : 'Received From'}
              </p>
            </div>
            <p className="text-white font-black text-lg mb-1 truncate">{listing.offeredResource.resourceType}</p>
            <p className="text-gray-300 font-semibold text-sm mb-1 truncate">{listing.offeredResource.resourceId}</p>
            <p className="text-xs text-gray-400 line-clamp-2">{listing.offeredResource.metadata}</p>
          </div>

          {/* Arrow divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
            <ArrowRight className="w-5 h-5 text-purple-400 mx-3" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
          </div>

          {/* What user received/gave */}
          {acceptedOffer?.offeredResources && acceptedOffer.offeredResources.length > 0 && (
            <div className={`p-5 rounded-2xl bg-gradient-to-br ${
              completedType === 'sold'
                ? 'from-blue-500/10 to-cyan-500/10 border border-blue-500/20'
                : 'from-emerald-500/10 to-green-500/10 border border-emerald-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className={`w-4 h-4 ${completedType === 'sold' ? 'text-blue-400' : 'text-emerald-400'}`} />
                <p className={`text-xs font-bold uppercase ${completedType === 'sold' ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {completedType === 'sold' ? 'You Received' : 'You Gave'}
                </p>
              </div>
              <div className="space-y-2">
                {acceptedOffer.offeredResources.slice(0, 2).map((resource, idx) => (
                  <div key={idx}>
                    <p className="text-white font-black text-lg mb-1 truncate">{resource.resourceType}</p>
                    <p className="text-gray-300 font-semibold text-sm mb-1 truncate">{resource.resourceId}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{resource.metadata}</p>
                  </div>
                ))}
                {acceptedOffer.offeredResources.length > 2 && (
                  <p className="text-xs text-gray-400 mt-2">+{acceptedOffer.offeredResources.length - 2} more items</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Normal View - Show Offering and Wants */}
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
                <Sparkles className="w-4 h-4 text-cyan-400" />
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
        </>
      )}

      {/* Owner */}
      <div className="mb-6 p-3 rounded-xl bg-slate-800/50 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{listing.owner.slice(0, 2)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Lister</p>
            <p className="text-xs text-gray-300 font-mono truncate">{listing.owner.slice(0, 12)}...{listing.owner.slice(-8)}</p>
          </div>
          {!isOwner && (
            <TrustBadge api={api} address={listing.owner} />
          )}
        </div>
        {/* Private listing: show target account trust score */}
        {listing.targetAccount && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0">
              <Lock className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Private Target</p>
              <p className="text-xs text-gray-300 font-mono truncate">{listing.targetAccount.slice(0, 12)}...{listing.targetAccount.slice(-8)}</p>
            </div>
            {isOwner && (
              <TrustBadge api={api} address={listing.targetAccount} />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {viewMode !== 'completed' && listing.status === 'Active' && (
        <>
          {isOwner ? (
            <div className="space-y-2">
              <button
                onClick={() => onViewOffers && onViewOffers(listing.id)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-2xl font-bold text-sm hover:shadow-xl hover:from-blue-500 hover:to-cyan-500 flex items-center justify-center gap-2 transition-all"
              >
                <Eye className="w-4 h-4" />
                View Offers
              </button>
              <button
                onClick={() => onCancelListing(listing.id)}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-2xl font-bold text-sm hover:shadow-xl hover:from-red-500 hover:to-red-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                <X className="w-4 h-4" />
                Cancel Listing
              </button>
            </div>
          ) : (
            <button
              onClick={() => onMakeOffer(listing.id)}
              disabled={!canMakeOffer || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Make Offer
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </>
      )}

      {viewMode === 'completed' && (
        <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          Trade Completed
        </div>
      )}
    </div>
  );
};

export default ListingCardComponent;
