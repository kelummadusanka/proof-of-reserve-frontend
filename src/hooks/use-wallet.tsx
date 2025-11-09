import { useState, useEffect } from 'react';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta, InjectedExtension } from '@polkadot/extension-inject/types';

const APP_NAME = 'Proof of Reserve Exchange';

export function useWallet() {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if extension is available and get accounts
  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Request access to extension
      const extensions: InjectedExtension[] = await web3Enable(APP_NAME);

      if (extensions.length === 0) {
        setError('No Polkadot extension found. Please install Polkadot.js extension.');
        setIsExtensionAvailable(false);
        return;
      }

      setIsExtensionAvailable(true);

      // Get all accounts
      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        setError('No accounts found. Please create an account in your Polkadot.js extension.');
        return;
      }

      setAccounts(allAccounts);

      // Auto-select first account if none selected
      if (!selectedAccount && allAccounts.length > 0) {
        setSelectedAccount(allAccounts[0]);
      }

      console.log(`✅ Connected wallet with ${allAccounts.length} account(s)`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Get injector for signing transactions
  const getInjector = async (address: string) => {
    try {
      const injector = await web3FromAddress(address);
      return injector;
    } catch (err) {
      console.error('Failed to get injector:', err);
      throw new Error('Failed to get signer for this account');
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    connectWallet();
  }, []);

  return {
    accounts,
    selectedAccount,
    isExtensionAvailable,
    isConnecting,
    error,
    connectWallet,
    setSelectedAccount,
    getInjector,
  };
}
