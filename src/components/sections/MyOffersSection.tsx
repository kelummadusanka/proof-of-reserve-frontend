import React from 'react';
import { Boxes, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import MyOfferCard from '../cards/MyOfferCard';
import { Offer, Listing } from '../../types';

interface MyOffersSectionProps {
  offers: Offer[];
  listings: Listing[];
  selectedAccount: string | null;
  currentTheme: {
    border: string;
    bg: string;
    text: string;
  };
  isLoading: boolean;
  onCancelOffer: (offerId: string) => void;
}

export const MyOffersSection: React.FC<MyOffersSectionProps> = ({
  offers,
  listings,
  selectedAccount,
  currentTheme,
  isLoading,
  onCancelOffer
}) => {
  // Separate pending and rejected offers
  const pendingOffers = offers.filter(o => o.status === 'Pending');
  const rejectedOffers = offers.filter(o => o.status === 'Rejected');
  const acceptedOffers = offers.filter(o => o.status === 'Accepted');

  // Create a map of listings for quick lookup
  const listingMap = new Map(listings.map(l => [l.id, l]));

  if (offers.length === 0) {
    return (
      <div className="text-center py-32">
        <Boxes className="w-20 h-20 text-purple-400 mx-auto mb-8 opacity-50" />
        <h3 className="text-4xl font-black text-white mb-4">No Offers</h3>
        <p className="text-xl text-gray-400">You haven't made any offers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Pending Offers Section */}
      {pendingOffers.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-black text-white">Pending to Approve</h2>
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
              {pendingOffers.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingOffers.map((offer, index) => {
              const listing = listingMap.get(offer.listingId);
              return (
                <MyOfferCard
                  key={offer.id}
                  offer={offer}
                  listing={listing}
                  index={index}
                  currentTheme={currentTheme}
                  onCancelOffer={onCancelOffer}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Accepted Offers Section */}
      {acceptedOffers.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-black text-white">Accepted Offers</h2>
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-500/20 text-green-300 border border-green-500/30">
              {acceptedOffers.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acceptedOffers.map((offer, index) => {
              const listing = listingMap.get(offer.listingId);
              return (
                <MyOfferCard
                  key={offer.id}
                  offer={offer}
                  listing={listing}
                  index={index}
                  currentTheme={currentTheme}
                  onCancelOffer={onCancelOffer}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected Offers Section */}
      {rejectedOffers.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-black text-white">Rejected Offers</h2>
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-500/20 text-red-300 border border-red-500/30">
              {rejectedOffers.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rejectedOffers.map((offer, index) => {
              const listing = listingMap.get(offer.listingId);
              return (
                <MyOfferCard
                  key={offer.id}
                  offer={offer}
                  listing={listing}
                  index={index}
                  currentTheme={currentTheme}
                  onCancelOffer={onCancelOffer}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOffersSection;
