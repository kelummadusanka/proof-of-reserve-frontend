import React from 'react';
import { TrendingUp } from 'lucide-react';

interface ListingsHeaderProps {
  viewMode: 'all' | 'myOffers' | 'myListings' | 'completed';
  count: number;
  theme: {
    border: string;
    bg: string;
    text: string;
  };
}

export const ListingsHeader: React.FC<ListingsHeaderProps> = ({
  viewMode,
  count,
  theme
}) => {
  const getTitle = () => {
    switch (viewMode) {
      case 'all': return 'Available Listings';
      case 'myListings': return 'My Listings';
      case 'myOffers': return 'My Offers';
      case 'completed': return 'Completed Trades';
    }
  };

  return (
    <div className="flex items-center justify-between mb-10">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${theme.bg} border ${theme.border}`}>
          <TrendingUp className={`w-6 h-6 ${theme.text}`} />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white">
            {getTitle()}
          </h3>
          <p className="text-sm text-gray-400">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ListingsHeader;
