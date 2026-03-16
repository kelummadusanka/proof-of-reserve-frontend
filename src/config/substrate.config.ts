import type { SubstrateConfig } from '../types/substrate';

export const substrateConfig: SubstrateConfig = {
  wsUrl: import.meta.env.VITE_SUBSTRATE_WS_URL || 'wss://p2p-barter-trade.projectfreedom.io:9443',
  appName: import.meta.env.VITE_APP_NAME || 'P2P Barter Exchange',
  palletName: import.meta.env.VITE_PALLET_NAME || 'template',
};

export const DEPOSIT_AMOUNTS = {
  LISTING: '100', // UNIT
  OFFER_PERCENTAGE: 0.5, // 50% of listing deposit
};

export const LIMITS = {
  MAX_METADATA_LENGTH: 256,
  MAX_OFFERED_RESOURCES: 10,
};
