import { useState, useEffect } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BlockchainState } from '../types/blockchain.types';
import { WS_URL } from '../utils/constants';

export const useBlockchain = () => {
  const [blockchain, setBlockchain] = useState<BlockchainState>({
    api: null,
    accounts: [],
    selectedAccount: null,
    connected: false,
    loading: false
  });

  const initializeBlockchain = async () => {
    try {
      setBlockchain(prev => ({ ...prev, loading: true }));
      const wsProvider = new WsProvider(WS_URL);
      const api = await ApiPromise.create({ provider: wsProvider });
      await api.isReady;
      setBlockchain(prev => ({ 
        ...prev, 
        api, 
        connected: true, 
        loading: false 
      }));
      return { success: true };
    } catch (error) {
      console.error('Blockchain connection error:', error);
      setBlockchain(prev => ({ ...prev, loading: false }));
      return { success: false, error };
    }
  };

  useEffect(() => {
    initializeBlockchain();
  }, []);

  return { blockchain, setBlockchain, initializeBlockchain };
};