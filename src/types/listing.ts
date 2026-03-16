// Rust-compatible type definitions for P2P Barter Trading Pallet

export type ListingStatus = 'Active' | 'Completed' | 'Cancelled';
export type OfferStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';

export interface Resource {
  resource_type: string;  // Type of resource (e.g., "NFT", "GameItem")
  resource_id: string;    // Unique identifier (e.g., "CryptoKitty#1234")
  metadata: string;       // Additional information/description
}

export interface Listing {
  id: string;
  owner: string; // AccountId as hex string
  offered_resource: Resource;
  desired_resources: Resource[];
  status: ListingStatus;
  deposit: string; // Balance as string
  created_at: number; // Block number
}

export interface TradeOffer {
  id: string;
  listing_id: string;
  offerer: string; // AccountId as hex string
  offered_resources: Resource[];
  status: OfferStatus;
  deposit: string; // Balance as string
  created_at: number; // Block number
}

export interface CreateListingInput {
  resource_type: string;
  resource_id: string;
  metadata: string;
  desired_resources?: Array<{
    resource_type: string;
    resource_id: string;
    metadata: string;
  }>;
}

export interface MakeOfferInput {
  listing_id: number;
  offered_resources: Array<{
    resource_type: string;
    resource_id: string;
    metadata: string;
  }>;
}