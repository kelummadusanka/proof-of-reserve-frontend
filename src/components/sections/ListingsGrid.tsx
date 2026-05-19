import React from 'react';
import { ApiPromise } from '@polkadot/api';
import { Boxes } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import ListingCardComponent from '../cards/ListingCardComponent';
import { Listing, Offer } from '../../types';

interface ListingsGridProps {
  listings: Listing[];
  selectedAccount: string | null;
  viewMode: 'all' | 'myOffers' | 'myListings' | 'completed';
  currentTheme: {
    border: string;
    bg: string;
    text: string;
  };
  searchTerm: string;
  isLoading: boolean;
  allOffers?: Offer[];
  onMakeOffer: (listingId: string) => void;
  onCancelListing: (listingId: string) => void;
  onViewOffers?: (listingId: string) => void;
  api?: ApiPromise | null;
}

export const ListingsGrid: React.FC<ListingsGridProps> = ({
  listings,
  selectedAccount,
  viewMode,
  currentTheme,
  searchTerm,
  isLoading,
  allOffers = [],
  onMakeOffer,
  onCancelListing,
  onViewOffers,
  api = null,
}) => {
  if (listings.length === 0) {
    return (
      <div className="text-center py-32">
        <Boxes className="w-20 h-20 text-purple-400 mx-auto mb-8 opacity-50" />
        <h3 className="text-4xl font-black text-white mb-4">
          {searchTerm ? 'No Results' : 'No Items'}
        </h3>
        <p className="text-xl text-gray-400">
          {searchTerm ? 'Try different search terms' : 'No items in this category yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {listings.map((listing, index) => {
        const listingOffers = allOffers.filter(o => o.listingId === listing.id);
        
        // Determine completed trade type and get accepted offer
        let completedType: 'sold' | 'purchased' | undefined = undefined;
        let acceptedOffer: Offer | undefined = undefined;
        
        if (viewMode === 'completed') {
          if (listing.owner === selectedAccount && listing.status === 'Completed') {
            completedType = 'sold';
            // Find accepted offer for sold listing
            acceptedOffer = listingOffers.find(o => o.status === 'Accepted');
          } else {
            completedType = 'purchased';
            // Find the accepted offer made by current user
            acceptedOffer = listingOffers.find(o => o.status === 'Accepted' && o.offerer === selectedAccount);
          }
        }
        
        return (
          <ListingCardComponent
            key={listing.id}
            listing={listing}
            currentTheme={currentTheme}
            index={index}
            isOwner={listing.owner === selectedAccount}
            canMakeOffer={true}
            viewMode={viewMode}
            offerIds={listingOffers.map(o => o.id)}
            completedType={completedType}
            acceptedOffer={acceptedOffer}
            onMakeOffer={onMakeOffer}
            onCancelListing={onCancelListing}
            onViewOffers={onViewOffers}
            isLoading={isLoading}
            api={api}
          />
        );
      })}
    </div>
  );
};

export default ListingsGrid;
