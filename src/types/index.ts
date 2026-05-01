// Export all types
export * from './listing';
export * from './blockchain.types';
export * from './offer.types';

// Common types used in components
export interface Resource {
  resourceType: string;
  resourceId: string;
  metadata: string;
}

export interface Listing {
  id: string;
  owner: string;
  offeredResource: Resource;
  desiredResources: Resource[];
  status: string;
  deposit: string;
  createdAt: number;
  targetAccount: string | null;
}

export interface Offer {
  id: string;
  listingId: string;
  offerer: string;
  offeredResources: Resource[];
  status: string;
  deposit: string;
  createdAt: number;
}

export interface BlockchainState {
  api: any | null;
  accounts: any[];
  selectedAccount: any | null;
  connected: boolean;
  loading: boolean;
}

export interface AddressBookEntry {
  name: string;
  address: string;
}

export interface Transaction {
  type: string;
  listingId?: string;
  offerId?: string;
  timestamp: number;
  status: string;
}

export type ViewMode = 'all' | 'myListings' | 'myOffers' | 'completed';

// Reputation types
export interface ReputationScore {
  accountId: string;
  overallScore: number;
  transactionComponent: number;
  feedbackComponent: number;
  disputeComponent: number;
  reliabilityComponent: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageRating: number;
  totalFeedback: number;
}

export interface UIReputationScore {
  overallScore: number;
  trustLevel: 'unproven' | 'risky' | 'neutral' | 'good' | 'excellent';
  successfulTransactions: number;
  failedTransactions: number;
  reliability: number;
  averageRating: number;
  totalFeedback: number;
}
