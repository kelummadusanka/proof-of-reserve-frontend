import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiPromise } from '@polkadot/api';
import { connectToSubstrate, disconnectFromSubstrate } from '@/services/substrate';

interface SubstrateContextType {
  api: ApiPromise | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (endpoint?: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

const SubstrateContext = createContext<SubstrateContextType | undefined>(undefined);

export function SubstrateProvider({ children }: { children: React.ReactNode }) {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async (endpoint?: string) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const apiInstance = await connectToSubstrate(endpoint);

      // Ensure API is fully ready with metadata loaded
      await apiInstance.isReady;

      // Log available pallets for debugging
      console.log('🔗 API Ready. Available tx pallets:', Object.keys(apiInstance.tx));

      setApi(apiInstance);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Substrate node';
      setError(errorMessage);
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    await disconnectFromSubstrate();
    setApi(null);
    setIsConnected(false);
  };

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  return (
    <SubstrateContext.Provider
      value={{
        api,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </SubstrateContext.Provider>
  );
}

export function useSubstrate() {
  const context = useContext(SubstrateContext);
  if (context === undefined) {
    throw new Error('useSubstrate must be used within a SubstrateProvider');
  }
  return context;
}
