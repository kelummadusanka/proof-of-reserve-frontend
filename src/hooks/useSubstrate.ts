import { useState, useEffect, useCallback } from 'react';
import type { ApiPromise } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { getSubstrateService } from '../services/substrate';
import type { SubstrateConfig, BlockchainState } from '../types/substrate';

const defaultConfig: SubstrateConfig = {
  wsUrl: import.meta.env.VITE_SUBSTRATE_WS_URL || 'ws://127.0.0.1:9944',
  appName: import.meta.env.VITE_APP_NAME || 'P2P Barter Exchange',
  palletName: import.meta.env.VITE_PALLET_NAME || 'template',
};

export const useSubstrate = (config: SubstrateConfig = defaultConfig) => {
  const [state, setState] = useState<BlockchainState>({
    api: null,
    accounts: [],
    selectedAccount: null,
    connected: false,
    loading: false,
    error: null,
  });

  const substrateService = getSubstrateService(config);

  // Initialize blockchain connection
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const api = await substrateService.connect();

      setState(prev => ({
        ...prev,
        api,
        connected: true,
        loading: false,
      }));

      return api;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to blockchain';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        connected: false,
      }));
      throw error;
    }
  }, [substrateService]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const accounts = await substrateService.getAccounts();

      setState(prev => ({
        ...prev,
        accounts,
        selectedAccount: accounts[0],
        loading: false,
      }));

      return accounts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [substrateService]);

  // Select account
  const selectAccount = useCallback((account: InjectedAccountWithMeta) => {
    setState(prev => ({ ...prev, selectedAccount: account }));
  }, []);

  // Disconnect
  const disconnect = useCallback(async () => {
    await substrateService.disconnect();
    setState({
      api: null,
      accounts: [],
      selectedAccount: null,
      connected: false,
      loading: false,
      error: null,
    });
  }, [substrateService]);

  // Auto-connect on mount
  useEffect(() => {
    connect().catch(console.error);

    return () => {
      disconnect();
    };
  }, []);

  return {
    ...state,
    connect,
    connectWallet,
    selectAccount,
    disconnect,
    substrateService,
  };
};
