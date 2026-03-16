import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
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
            placeholder="Search listings by resource type, ID, or owner..."
            className="w-full pl-14 pr-5 py-5 bg-slate-900/50 border border-purple-500/30 rounded-2xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-500 backdrop-blur-xl"
          />
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-6 py-5 bg-slate-900/50 border border-purple-500/30 rounded-2xl text-white hover:border-purple-500 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};