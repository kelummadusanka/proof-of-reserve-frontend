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

export type ViewMode = 'all' | 'myListings' | 'myOffers' | 'completed';