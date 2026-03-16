import { Resource } from './listing.types';

export interface Offer {
  id: string;
  listingId: string;
  offerer: string;
  offeredResources: Resource[];
  status: string;
  deposit: string;
  createdAt: number;
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
  details?: any;
}