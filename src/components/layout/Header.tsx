import React from 'react';
import { Boxes, Plus, X, Wallet, Menu } from 'lucide-react';
import { formatBalance, formatAddress } from '../../utils/formatters';

interface HeaderProps {
  connected: boolean;
  selectedAccount: any;
  balance: string;
  showForm: boolean;
  onToggleForm: () => void;
  onConnectWallet: () => void;
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  selectedAccount,
  balance,
  showForm,
  onToggleForm,
  onConnectWallet,
  onOpenSidebar
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75 animate-pulse"></div>
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
                <Boxes className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">
                Barter<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">SWAP</span>
              </h1>
              <p className="text-xs text-gray-400 font-medium">Web3 P2P Trading Protocol</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {connected && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm text-green-100 font-semibold">Live</span>
              </div>
            )}

            {selectedAccount && (
              <div className="flex items-center gap-3">
                <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  {formatBalance(balance)} UNIT
                </div>
                <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white text-sm font-bold">
                  {formatAddress(selectedAccount.address)}
                </div>
              </div>
            )}

            {!selectedAccount && (
              <button
                onClick={onConnectWallet}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-full hover:shadow-lg font-bold flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect
              </button>
            )}

            <button
              onClick={onToggleForm}
              className={`${showForm 
                ? "bg-gradient-to-r from-slate-700 to-slate-600" 
                : "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"
              } text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2`}
              disabled={!selectedAccount}
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cancel" : "Create"}
            </button>

            <button
              onClick={onOpenSidebar}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};