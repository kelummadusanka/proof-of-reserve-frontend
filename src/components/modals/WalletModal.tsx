import React from 'react';
import { X, Wallet, ArrowRight } from 'lucide-react';

interface WalletModalProps {
  onClose: () => void;
  onConnect: () => Promise<void>;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  onClose,
  onConnect
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-md w-full border border-purple-500/30 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-white">Connect Wallet</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        <button
          onClick={onConnect}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3"
        >
          <Wallet className="w-6 h-6" />
          Connect Polkadot.js
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-sm text-gray-400 mt-6 text-center">
          🔒 Secure connection via Polkadot extension
        </p>
      </div>
    </div>
  );
};