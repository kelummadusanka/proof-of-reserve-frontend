import { useState, useEffect } from 'react';
import { Transaction } from '../types/offer.types';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('barterTransactions');
    if (stored) {
      setTransactions(JSON.parse(stored));
    }
  }, []);

  const saveTransaction = (tx: Transaction) => {
    const updated = [tx, ...transactions].slice(0, 50);
    localStorage.setItem('barterTransactions', JSON.stringify(updated));
    setTransactions(updated);
  };

  const getTransactionLabel = (tx: Transaction): string => {
    switch(tx.type) {
      case 'ListingCreated': return `📝 Listed Item`;
      case 'OfferMade': return `💼 Made Offer`;
      case 'TradeCompleted': return `✅ Trade Completed`;
      case 'ListingCancelled': return `🚫 Listing Cancelled`;
      case 'OfferCancelled': return `🚫 Offer Cancelled`;
      case 'OfferRejected': return `❌ Offer Rejected`;
      default: return tx.type;
    }
  };

  return {
    transactions,
    saveTransaction,
    getTransactionLabel
  };
};