import React from 'react';
import { X, BookOpen, History, ChevronRight } from 'lucide-react';
import { Offer } from '../../types/offer.types';
import { formatTimeElapsed } from '../../utils/formatters';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  addressBookCount: number;
  transactionsCount: number;
  recentOffers: Offer[];
  onOpenAddressBook: () => void;
  onOpenTransactionHistory: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  addressBookCount,
  transactionsCount,
  recentOffers,
  onOpenAddressBook,
  onOpenTransactionHistory
}) => {
  return (
    <div className={`fixed right-0 top-0 h-full w-96 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4 overflow-y-auto h-[calc(100%-100px)]">
        <button
          onClick={() => {
            onOpenAddressBook();
            onClose();
          }}
          className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl hover:border-purple-500 transition"
        >
          <BookOpen className="w-5 h-5 text-purple-400" />
          <div className="flex-1 text-left">
            <p className="text-white font-semibold">Address Book</p>
            <p className="text-xs text-gray-400">{addressBookCount} contacts</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <button
          onClick={() => {
            onOpenTransactionHistory();
            onClose();
          }}
          className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl hover:border-cyan-500 transition"
        >
          <History className="w-5 h-5 text-cyan-400" />
          <div className="flex-1 text-left">
            <p className="text-white font-semibold">Transaction History</p>
            <p className="text-xs text-gray-400">{transactionsCount} transactions</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <div className="mt-6">
          <h3 className="text-xs text-gray-500 font-bold uppercase mb-3">Recent Offers</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recentOffers.slice(0, 5).map(offer => (
              <div key={offer.id} className="p-3 bg-slate-800/50 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-purple-400 font-bold">Offer #{offer.id}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    offer.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' :
                    offer.status === 'Accepted' ? 'bg-green-500/20 text-green-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {offer.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Listing #{offer.listingId} • {formatTimeElapsed(offer.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};