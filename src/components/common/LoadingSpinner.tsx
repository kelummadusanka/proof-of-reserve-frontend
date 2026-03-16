import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="text-center py-32">
      <div className="relative inline-block mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
        <div className="relative inline-flex items-center justify-center p-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
        </div>
      </div>
      <h3 className="text-4xl font-black text-white mb-4">Connecting to Substrate...</h3>
      <p className="text-xl text-gray-400">Initializing blockchain connection</p>
    </div>
  );
};