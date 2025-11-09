import { ApiPromise, WsProvider } from '@polkadot/api';

// Default Substrate node endpoint
//const WS_PROVIDER = 'wss://109.199.104.152:9443';
const WS_PROVIDER = 'wss://polkadev.publicvm.com:9443';

let apiInstance: ApiPromise | null = null;
let apiPromise: Promise<ApiPromise> | null = null;

/**
 * Connect to Substrate node and return API instance
 */
export async function connectToSubstrate(endpoint: string = WS_PROVIDER): Promise<ApiPromise> {
  // Return existing instance if already connected
  if (apiInstance && apiInstance.isConnected) {
    return apiInstance;
  }

  // Return existing connection attempt if in progress
  if (apiPromise) {
    return apiPromise;
  }

  // Create new connection
  apiPromise = new Promise(async (resolve, reject) => {
    try {
      const provider = new WsProvider(endpoint);
      const api = await ApiPromise.create({ provider });

      // Wait for API to be ready
      await api.isReady;

      apiInstance = api;
      apiPromise = null;

      console.log('✅ Connected to Substrate node:', endpoint);
      console.log('Chain:', (await api.rpc.system.chain()).toString());
      console.log('Node version:', (await api.rpc.system.version()).toString());

      resolve(api);
    } catch (error) {
      apiPromise = null;
      console.error('❌ Failed to connect to Substrate node:', error);
      reject(error);
    }
  });

  return apiPromise;
}

/**
 * Get current API instance (null if not connected)
 */
export function getApi(): ApiPromise | null {
  return apiInstance;
}

/**
 * Disconnect from Substrate node
 */
export async function disconnectFromSubstrate(): Promise<void> {
  if (apiInstance) {
    await apiInstance.disconnect();
    apiInstance = null;
    console.log('🔌 Disconnected from Substrate node');
  }
}

/**
 * Check if connected to Substrate node
 */
export function isConnected(): boolean {
  return apiInstance !== null && apiInstance.isConnected;
}
