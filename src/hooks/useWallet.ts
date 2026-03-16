import { useState } from 'react';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { BlockchainState } from '../types/blockchain.types';
import { APP_NAME } from '../utils/constants';

export const useWallet = (blockchain: BlockchainState, setBlockchain: (state: BlockchainState) => void) => {
  const [balance, setBalance] = useState<string>('0');

  const connectWallet = async () => {
    try {
      const extensions = await web3Enable(APP_NAME);
      if (extensions.length === 0) {
        return { success: false, error: 'Please install Polkadot.js extension' };
      }

      const allAccounts = await web3Accounts();
      if (allAccounts.length === 0) {
        return { success: false, error: 'No accounts found in wallet' };
      }

      setBlockchain({
        ...blockchain,
        accounts: allAccounts,
        selectedAccount: allAccounts[0]
      });

      return { success: true };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return { success: false, error };
    }
  };

  const loadBalance = async () => {
    if (!blockchain.api || !blockchain.selectedAccount) return;
    try {
      const account = await blockchain.api.query.system.account(blockchain.selectedAccount.address);
      const free = account.data.free.toString();
      const formatted = (parseInt(free) / 1e12).toFixed(4);
      setBalance(formatted);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  return { balance, connectWallet, loadBalance };
};