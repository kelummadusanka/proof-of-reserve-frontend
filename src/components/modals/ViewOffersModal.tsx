import React from 'react';
import { ApiPromise } from '@polkadot/api';
import { X, CheckCircle, XCircle, TrendingUp, Clock } from 'lucide-react';
import { Offer, Listing, Resource } from '../../types';
import { TrustBadge } from '../ui/TrustBadge';

interface ViewOffersModalProps {
  listing: Listing | null;
  offers: Offer[];
  onClose: () => void;
  onAccept: (offerId: string) => Promise<void>;
  onReject: (offerId: string) => Promise<void>;
  isLoading: boolean;
  acceptedOfferId?: string | null;
  api?: ApiPromise | null;
}

export const ViewOffersModal: React.FC<ViewOffersModalProps> = ({
  listing,
  offers,
  onClose,
  onAccept,
  onReject,
  isLoading,
  acceptedOfferId,
  api = null,
}) => {
  if (!listing) return null;

  const pendingOffers = offers.filter(o => o.status === 'Pending');

  const getOfferStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'Accepted':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'Rejected':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-4xl w-full border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <h3 className="text-3xl font-bold text-white mb-2">Offers Received</h3>
            <p className="text-gray-400">
              Offering: <span className="font-semibold text-purple-400">{listing.offeredResource.resourceType}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Offers List */}
        {offers.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No offers received yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`p-6 rounded-2xl border transition-all ${
                  acceptedOfferId === offer.id
                    ? 'bg-green-500/10 border-green-500/50'
                    : 'bg-slate-800/50 border-purple-500/20 hover:border-purple-500/50'
                }`}
              >
                {/* Offer Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-bold text-lg">
                        Offer from:{' '}
                        <span className="text-purple-400 font-mono text-sm">
                          {offer.offerer.slice(0, 10)}...{offer.offerer.slice(-10)}
                        </span>
                      </p>
                      <TrustBadge api={api} address={offer.offerer} />
                    </div>
                    <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Created: {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getOfferStatusColor(offer.status)}`}>
                    {getStatusText(offer.status)}
                  </span>
                </div>

                {/* Offered Resources */}
                <div className="mb-4 p-4 bg-slate-900/50 rounded-xl">
                  <p className="text-gray-300 font-semibold mb-3 text-sm uppercase">Offering in Exchange:</p>
                  <div className="space-y-2">
                    {offer.offeredResources.map((resource: Resource, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold">{resource.resourceType}</p>
                          <p className="text-gray-400 text-sm font-mono truncate">{resource.resourceId}</p>
                          {resource.metadata && (
                            <p className="text-gray-500 text-xs mt-1 truncate">{resource.metadata}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {offer.status === 'Pending' && acceptedOfferId !== offer.id && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => onAccept(offer.id)}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Accept Offer
                    </button>
                    <button
                      onClick={() => onReject(offer.id)}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Offer
                    </button>
                  </div>
                )}

                {acceptedOfferId === offer.id && (
                  <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-xl">
                    <p className="text-green-400 font-bold">✓ This offer has been accepted!</p>
                    <p className="text-green-400/80 text-sm mt-1">
                      The trade will be completed on-chain. Check transaction history for updates.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewOffersModal;