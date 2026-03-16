import React from 'react';
import { Boxes } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  showCreateButton = false,
  onCreateClick
}) => {
  return (
    <div className="text-center py-32">
      <div className="relative inline-block mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
        <div className="relative inline-flex items-center justify-center p-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <Boxes className="w-20 h-20 text-purple-400" />
        </div>
      </div>
      <h3 className="text-4xl font-black text-white mb-4">{title}</h3>
      <p className="text-xl text-gray-400 mb-10 max-w-md mx-auto">{description}</p>
      {showCreateButton && onCreateClick && (
        <button
          onClick={onCreateClick}
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 inline-flex items-center gap-3 group"
        >
          Create First Listing
        </button>
      )}
    </div>
  );
};