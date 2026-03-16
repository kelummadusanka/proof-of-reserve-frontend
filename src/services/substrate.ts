import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { UIListing, UIOffer, SubstrateConfig } from '../types/substrate';

class SubstrateService {
  private api: ApiPromise | null = null;
  private config: SubstrateConfig;

  constructor(config: SubstrateConfig) {
    this.config = config;
  }

  // Initialize connection to Substrate node
  async connect(): Promise<ApiPromise> {
    try {
      const wsProvider = new WsProvider(this.config.wsUrl);
      this.api = await ApiPromise.create({ provider: wsProvider });

      await this.api.isReady;
      console.log('Connected to Substrate node:', this.config.wsUrl);

      return this.api;
    } catch (error) {
      console.error('Failed to connect to Substrate node:', error);
      throw error;
    }
  }

  // Get the API instance
  getApi(): ApiPromise {
    if (!this.api) {
      throw new Error('API not initialized. Call connect() first.');
    }
    return this.api;
  }

  // Disconnect from the node
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }

  // Enable and get wallet accounts
  async getAccounts(): Promise<InjectedAccountWithMeta[]> {
    const extensions = await web3Enable(this.config.appName);

    if (extensions.length === 0) {
      throw new Error('No Polkadot extension found. Please install Polkadot.js extension.');
    }

    const accounts = await web3Accounts();

    if (accounts.length === 0) {
      throw new Error('No accounts found in wallet.');
    }

    return accounts;
  }

  // Create a new listing
async createListing(
  account: InjectedAccountWithMeta,
  resourceType: string,
  resourceId: string,
  metadata: string,
  desiredResources: Array<{ type: string; id: string; metadata: string }> | null
): Promise<void> {
  if (!this.api) throw new Error('API not initialized');

  const injector = await web3FromAddress(account.address);

  // ✅ DO NOT convert to number[]
  const resourceTypeBytes = resourceType;
  const resourceIdBytes = resourceId;
  const metadataBytes = metadata;

  // ✅ Option<T> must be null or value
  const desiredResourcesParam =
    desiredResources && desiredResources.length > 0
      ? desiredResources.map(r => [
          r.type,
          r.id,
          r.metadata,
        ])
      : null;

  const extrinsic = this.api.tx[this.config.palletName].createListing(
    resourceTypeBytes,
    resourceIdBytes,
    metadataBytes,
    desiredResourcesParam
  );

  return this.sendExtrinsic(extrinsic, account.address, injector.signer);
}


  // Make an offer on a listing
async makeOffer(
  account: InjectedAccountWithMeta,
  listingId: number,
  offeredResources: Array<{ type: string; id: string; metadata: string }>
): Promise<void> {
  if (!this.api) throw new Error('API not initialized');

  const injector = await web3FromAddress(account.address);

  // ✅ Strings only, no byte arrays
  const offeredResourcesParam = offeredResources.map(r => [
    r.type,
    r.id,
    r.metadata,
  ]);

  const extrinsic = this.api.tx[this.config.palletName].makeOffer(
    listingId,
    offeredResourcesParam
  );

  return this.sendExtrinsic(extrinsic, account.address, injector.signer);
}

  // Accept an offer
  async acceptOffer(account: InjectedAccountWithMeta, offerId: number): Promise<void> {
    if (!this.api) throw new Error('API not initialized');

    const injector = await web3FromAddress(account.address);
    const extrinsic = this.api.tx[this.config.palletName].acceptOffer(offerId);

    return this.sendExtrinsic(extrinsic, account.address, injector.signer);
  }

  // Reject an offer
  async rejectOffer(account: InjectedAccountWithMeta, offerId: number): Promise<void> {
    if (!this.api) throw new Error('API not initialized');

    const injector = await web3FromAddress(account.address);
    const extrinsic = this.api.tx[this.config.palletName].rejectOffer(offerId);

    return this.sendExtrinsic(extrinsic, account.address, injector.signer);
  }

  // Cancel a listing
  async cancelListing(account: InjectedAccountWithMeta, listingId: number): Promise<void> {
    if (!this.api) throw new Error('API not initialized');

    const injector = await web3FromAddress(account.address);
    const extrinsic = this.api.tx[this.config.palletName].cancelListing(listingId);

    return this.sendExtrinsic(extrinsic, account.address, injector.signer);
  }

  // Cancel an offer
  async cancelOffer(account: InjectedAccountWithMeta, offerId: number): Promise<void> {
    if (!this.api) throw new Error('API not initialized');

    const injector = await web3FromAddress(account.address);
    const extrinsic = this.api.tx[this.config.palletName].cancelOffer(offerId);

    return this.sendExtrinsic(extrinsic, account.address, injector.signer);
  }

  // Get all active listings
  async getListings(): Promise<UIListing[]> {
    if (!this.api) throw new Error('API not initialized');

    try {
      const nextId = await this.api.query[this.config.palletName].nextListingId();
      const listingCount = (nextId as any).toNumber();

      const listings: UIListing[] = [];

      for (let i = 0; i < listingCount; i++) {
        const listing = await this.api.query[this.config.palletName].listings(i);

        if ((listing as any).isSome) {
          const listingData = (listing as any).unwrap();
          const status = listingData.status.toString();

          // Only include active listings
          if (status === 'Active') {
            listings.push({
              id: i.toString(),
              owner: listingData.owner.toString(),
              offered_resource: {
                name: this.decodeBytes(listingData.offeredResource.resourceType),
                quantity: this.decodeBytes(listingData.offeredResource.resourceId),
                unit: this.decodeBytes(listingData.offeredResource.metadata)
              },
              desired_resources: listingData.desiredResources.map((r: any) => ({
                name: this.decodeBytes(r.resourceType),
                quantity: this.decodeBytes(r.resourceId),
                unit: this.decodeBytes(r.metadata)
              })),
              status: status,
              deposit: listingData.deposit.toString(),
              created_at: listingData.createdAt.toNumber()
            });
          }
        }
      }

      return listings;
    } catch (error) {
      console.error('Error loading listings:', error);
      throw error;
    }
  }

  // Get offers for a listing
  async getOffersForListing(listingId: number): Promise<UIOffer[]> {
    if (!this.api) throw new Error('API not initialized');

    try {
      const offerIds = await this.api.query[this.config.palletName].offersByListing(listingId);
      const offers: UIOffer[] = [];

      for (const offerId of (offerIds as any)) {
        const offer = await this.api.query[this.config.palletName].offers(offerId);

        if ((offer as any).isSome) {
          const offerData = (offer as any).unwrap();

          offers.push({
            id: offerId.toString(),
            listingId: offerData.listingId.toString(),
            offerer: offerData.offerer.toString(),
            offered_resources: offerData.offeredResources.map((r: any) => ({
              name: this.decodeBytes(r.resourceType),
              quantity: this.decodeBytes(r.resourceId),
              unit: this.decodeBytes(r.metadata)
            })),
            status: offerData.status.toString(),
            deposit: offerData.deposit.toString(),
            created_at: offerData.createdAt.toNumber()
          });
        }
      }

      return offers;
    } catch (error) {
      console.error('Error loading offers:', error);
      throw error;
    }
  }

  // Subscribe to blockchain events
  subscribeToEvents(callback: (event: any) => void): () => void {
    if (!this.api) throw new Error('API not initialized');

    const unsubscribe = this.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;

        if (event.section === this.config.palletName) {
          callback(event);
        }
      });
    });

    return unsubscribe as any;
  }

  // Helper: Send extrinsic
  private sendExtrinsic(extrinsic: SubmittableExtrinsic<'promise'>, address: string, signer: any): Promise<void> {
    return new Promise((resolve, reject) => {
      extrinsic.signAndSend(
        address,
        { signer },
        ({ status, dispatchError }) => {
          if (status.isInBlock) {
            if (dispatchError) {
              if (dispatchError.isModule) {
                const decoded = this.api!.registry.findMetaError(dispatchError.asModule);
                reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs}`));
              } else {
                reject(new Error(dispatchError.toString()));
              }
            } else {
              resolve();
            }
          }
        }
      ).catch(reject);
    });
  }

  // Helper: Decode bytes to string
  private decodeBytes(bytes: any): string {
    try {
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      return '';
    }
  }
}

// Export singleton instance
export const getSubstrateService = (() => {
  let instance: SubstrateService | null = null;

  return (config: SubstrateConfig): SubstrateService => {
    if (!instance) {
      instance = new SubstrateService(config);
    }
    return instance;
  };
})();

export default SubstrateService;
