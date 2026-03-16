import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { ApiPromise } from '@polkadot/api';
import type { u64, u32, Vec, Option } from '@polkadot/types';
import type { AccountId, BlockNumber, Balance } from '@polkadot/types/interfaces';
import type { Codec } from '@polkadot/types/types';

// Pallet-specific types matching your Substrate pallet

export enum ListingStatus {
  Active = 'Active',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum OfferStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}

export interface Resource {
  resourceType: string;
  resourceId: string;
  metadata: string;
}

export interface RawResource extends Codec {
  resourceType: Vec<u32>;
  resourceId: Vec<u32>;
  metadata: Vec<u32>;
}

export interface Listing {
  owner: AccountId;
  offeredResource: RawResource;
  desiredResources: Vec<RawResource>;
  status: ListingStatus;
  deposit: Balance;
  createdAt: BlockNumber;
}

export interface TradeOffer {
  listingId: u64;
  offerer: AccountId;
  offeredResources: Vec<RawResource>;
  status: OfferStatus;
  deposit: Balance;
  createdAt: BlockNumber;
}

// UI-friendly types
export interface UIResource {
  name: string;
  quantity: string;
  unit: string;
  metadata?: string;
}

export interface UIListing {
  id: string;
  owner: string;
  offered_resource: UIResource;
  desired_resources: UIResource[];
  status: string;
  deposit: string;
  created_at: number;
}

export interface UIOffer {
  id: string;
  listingId: string;
  offerer: string;
  offered_resources: UIResource[];
  status: string;
  deposit: string;
  created_at: number;
}

// Blockchain state
export interface BlockchainState {
  api: ApiPromise | null;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
}

// Form types
export interface CreateListingForm {
  resourceType: string;
  resourceId: string;
  metadata: string;
  desiredResources: Array<{
    type: string;
    id: string;
    metadata: string;
  }>;
}

export interface MakeOfferForm {
  listingId: string;
  offeredResources: Array<{
    type: string;
    id: string;
    metadata: string;
  }>;
}

// Config
export interface SubstrateConfig {
  wsUrl: string;
  appName: string;
  palletName: string;
}
