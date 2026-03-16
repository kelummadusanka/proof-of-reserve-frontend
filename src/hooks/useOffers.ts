import { useState, useCallback } from 'react';
import { ApiPromise } from '@polkadot/api';
import { Offer } from '../types/offer.types';

export const useOffers = (api: ApiPromise | null, selectedAccount: string | null) => {
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAllOffers = useCallback(async () => {
    if (!api) return;
    try {
      setLoading(true);
      const nextId = await api.query.template.nextOfferId();
      const offerCount = nextId.toNumber();
      const loadedOffers: Offer[] = [];

      for (let i = 0; i < offerCount; i++) {
        const offer = await api.query.template.offers(i);
        if (offer.isSome) {
          const offerData = offer.unwrap();
          loadedOffers.push({
            id: i.toString(),
            listingId: offerData.listingId.toString(),
            offerer: offerData.offerer.toString(),
            offeredResources: offerData.offeredResources.map((r: any) => ({
              resourceType: new TextDecoder().decode(r.resourceType),
              resourceId: new TextDecoder().decode(r.resourceId),
              metadata: new TextDecoder().decode(r.metadata)
            })),
            status: offerData.status.toString(),
            deposit: offerData.deposit.toString(),
            createdAt: offerData.createdAt.toNumber()
          });
        }
      }
      setAllOffers(loadedOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadMyOffers = useCallback(async () => {
    if (!api || !selectedAccount) return;
    try {
      const offerIds = await api.query.template.offersByOfferer(selectedAccount);
      const loadedOffers: Offer[] = [];
      
      for (const offerId of offerIds) {
        const offer = await api.query.template.offers(offerId.toNumber());
        if (offer.isSome) {
          const offerData = offer.unwrap();
          loadedOffers.push({
            id: offerId.toString(),
            listingId: offerData.listingId.toString(),
            offerer: offerData.offerer.toString(),
            offeredResources: offerData.offeredResources.map((r: any) => ({
              resourceType: new TextDecoder().decode(r.resourceType),
              resourceId: new TextDecoder().decode(r.resourceId),
              metadata: new TextDecoder().decode(r.metadata)
            })),
            status: offerData.status.toString(),
            deposit: offerData.deposit.toString(),
            createdAt: offerData.createdAt.toNumber()
          });
        }
      }
      setMyOffers(loadedOffers);
    } catch (error) {
      console.error('Error loading my offers:', error);
    }
  }, [api, selectedAccount]);

  const hasUserOffered = useCallback((listingId: string): boolean => {
    return myOffers.some(offer => offer.listingId === listingId && offer.status === 'Pending');
  }, [myOffers]);

  const getOffersForListing = useCallback((listingId: string): Offer[] => {
    return allOffers.filter(offer => offer.listingId === listingId);
  }, [allOffers]);

  const getPendingOffersCount = useCallback((listingId: string): number => {
    return allOffers.filter(offer => offer.listingId === listingId && offer.status === 'Pending').length;
  }, [allOffers]);

  return { 
    allOffers, 
    myOffers, 
    loading, 
    loadAllOffers, 
    loadMyOffers,
    hasUserOffered,
    getOffersForListing,
    getPendingOffersCount
  };
};