import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface SearchSectionProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  refreshing
}) => {
  return (
    <div className="mb-12">
      <div className="max-w-2xl mx-auto flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search listings..."
            className="w-full pl-14 pr-5 py-5 bg-slate-900/50 border border-purple-500/30 rounded-2xl text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-6 py-5 bg-slate-900/50 border border-purple-500/30 rounded-2xl text-white hover:border-purple-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default SearchSection;
