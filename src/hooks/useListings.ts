import { useState, useCallback } from 'react';
import { ApiPromise } from '@polkadot/api';
import { Listing } from '../types/listing.types';

export const useListings = (api: ApiPromise | null) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  const loadListings = useCallback(async () => {
    if (!api) return;
    try {
      setLoading(true);
      const nextId = await api.query.template.nextListingId();
      const listingCount = nextId.toNumber();
      const loadedListings: Listing[] = [];

      for (let i = 0; i < listingCount; i++) {
        const listing = await api.query.template.listings(i);
        if (listing.isSome) {
          const listingData = listing.unwrap();
          const status = listingData.status.toString();
          
          const desiredResources = listingData.desiredResources.map((r: any) => ({
            resourceType: new TextDecoder().decode(r.resourceType),
            resourceId: new TextDecoder().decode(r.resourceId),
            metadata: new TextDecoder().decode(r.metadata)
          }));

          loadedListings.push({
            id: i.toString(),
            owner: listingData.owner.toString(),
            offeredResource: {
              resourceType: new TextDecoder().decode(listingData.offeredResource.resourceType),
              resourceId: new TextDecoder().decode(listingData.offeredResource.resourceId),
              metadata: new TextDecoder().decode(listingData.offeredResource.metadata)
            },
            desiredResources,
            status,
            deposit: listingData.deposit.toString(),
            createdAt: listingData.createdAt.toNumber(),
            targetAccount: listingData.targetAccount.isSome ? listingData.targetAccount.unwrap().toString() : null
          });
        }
      }
      setListings(loadedListings);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  return { listings, loading, loadListings };
};