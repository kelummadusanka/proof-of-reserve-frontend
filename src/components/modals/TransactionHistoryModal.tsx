import React from 'react';
import { X, History } from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionHistoryModalProps {
  transactions: Transaction[];
  onClose: () => void;
}

const getLabel = (tx: Transaction): string => {
  if (tx.type === 'Listing Created') return '📝 Listing Created';
  if (tx.type === 'Offer Made') return '💼 Offer Made';
  if (tx.type === 'Trade Completed') return '✨ Trade Completed';
  if (tx.type === 'Listing Cancelled') return '🚫 Listing Cancelled';
  if (tx.type === 'Offer Cancelled') return '🚫 Offer Cancelled';
  if (tx.type === 'Offer Rejected') return '❌ Offer Rejected';
  if (tx.type === 'Offer Accepted') return '✅ Offer Accepted';
  return 'Transaction';
};

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  transactions,
  onClose
}) => {

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-3xl w-full border border-cyan-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600">
              <History className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white">Transaction History</h3>
</div>
<button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
<X className="w-6 h-6 text-gray-400" />
</button>
</div>
<div className="space-y-3">
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No transactions yet</p>
        </div>
      ) : (
        transactions.map((tx, index) => (
          <div key={index} className="p-5 bg-slate-800/50 rounded-2xl border border-cyan-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold">{getLabel(tx)}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                tx.status === 'Active' || tx.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' :
                tx.status === 'Completed' ? 'bg-green-500/20 text-green-300' :
                tx.status === 'Cancelled' || tx.status === 'Rejected' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {tx.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {tx.listingId && `Listing #${tx.listingId}`}
                {tx.offerId && ` • Offer #${tx.offerId}`}
              </span>
              <span className="text-gray-500 text-xs">
                {new Date(tx.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
</div>
);
};