import { useState, useEffect } from "react";
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { Boxes, Plus, Zap, Sparkles, Check } from "lucide-react";

// Components
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { HeroSection } from "../components/sections/HeroSection";
import { StatsSection } from "../components/sections/StatsSection";
import { SearchSection } from "../components/sections/SearchSection";
import { ListingsHeader } from "../components/sections/ListingsHeader";
import { ListingsGrid } from "../components/sections/ListingsGrid";
import { MyOffersSection } from "../components/sections/MyOffersSection";
import { Notification } from "../components/common/Notification";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

// Modals
import { WalletModal } from "../components/modals/WalletModal";
import { CreateListingModal } from "../components/modals/CreateListingModal";
import { MakeOfferModal } from "../components/modals/MakeOfferModal";
import { AddressBookModal } from "../components/modals/AddressBookModal";
import { AddContactModal } from "../components/modals/AddContactModal";
import { TransactionHistoryModal } from "../components/modals/TransactionHistoryModal";
import { ViewOffersModal } from "../components/modals/ViewOffersModal";

// Config
import { substrateConfig } from "../config/substrate.config";

// Types
import {
  Listing,
  Offer,
  BlockchainState,
  AddressBookEntry,
  Transaction,
  ViewMode,
  Resource
} from "../types";

// Utils
const formatBalance = (bal: string): string => {
  const num = parseFloat(bal);
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(2);
};

export default function BarterExchange() {
  // Blockchain State
  const [blockchain, setBlockchain] = useState<BlockchainState>({
    api: null,
    accounts: [],
    selectedAccount: null,
    connected: false,
    loading: false
  });

  // Data States
  const [listings, setListings] = useState<Listing[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [balance, setBalance] = useState<string>('0');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showAddressBookModal, setShowAddressBookModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showViewOffersModal, setShowViewOffersModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form States
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({ name: '', address: '' });
  const [editingContact, setEditingContact] = useState<number | null>(null);
  const [acceptedOfferId, setAcceptedOfferId] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    initializeBlockchain();
    loadAddressBook();
    loadTransactions();
  }, []);

  // Load data when connected
  useEffect(() => {
    if (blockchain.api && blockchain.connected) {
      loadListings();
      loadAllOffers();
      loadMyOffers();
      subscribeToEvents();
    }
  }, [blockchain.api, blockchain.connected, blockchain.selectedAccount]);

  // Load balance when account changes
  useEffect(() => {
    if (blockchain.api && blockchain.selectedAccount) {
      loadBalance();
    }
  }, [blockchain.api, blockchain.selectedAccount]);

  // Blockchain Functions
  const initializeBlockchain = async () => {
    try {
      setBlockchain(prev => ({ ...prev, loading: true }));

      const wsUrl = substrateConfig.wsUrl;
      console.log('Connecting to Substrate node:', wsUrl);
      const wsProvider = new WsProvider(wsUrl);
      const api = await ApiPromise.create({ provider: wsProvider });

      await api.isReady;
      console.log('✅ Connected successfully!');

      setBlockchain(prev => ({ 
        ...prev, 
        api, 
        connected: true, 
        loading: false 
      }));

      showNotification('🚀 Connected to blockchain', 'success');
    } catch (error) {
      console.error('Blockchain connection error:', error);
      showNotification('Failed to connect to blockchain', 'error');
      setBlockchain(prev => ({ ...prev, loading: false }));
    }
  };

  const connectWallet = async () => {
    try {
      const extensions = await web3Enable('Barter Exchange');
      
      if (extensions.length === 0) {
        showNotification('Please install Polkadot.js extension', 'error');
        window.open('https://polkadot.js.org/extension/', '_blank');
        return;
      }

      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        showNotification('No accounts found in wallet', 'error');
        return;
      }

      setBlockchain(prev => ({ 
        ...prev, 
        accounts: allAccounts,
        selectedAccount: allAccounts[0]
      }));

      setShowWalletModal(false);
      showNotification('✅ Wallet connected successfully', 'success');
      
      if (blockchain.api) {
        loadMyOffers();
        loadBalance();
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      showNotification('Failed to connect wallet', 'error');
    }
  };

  const loadBalance = async () => {
    if (!blockchain.api || !blockchain.selectedAccount) return;

    try {
      const account = await blockchain.api.query.system.account(blockchain.selectedAccount.address);
      const free = account.data.free.toString();
      const formatted = (parseInt(free) / 1e12).toFixed(4);
      setBalance(formatted);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadListings = async () => {
    if (!blockchain.api) return;

    try {
      setRefreshing(true);
      const nextId = await blockchain.api.query.template.nextListingId();
      const listingCount = nextId.toNumber();
      
      const loadedListings: Listing[] = [];

      for (let i = 0; i < listingCount; i++) {
        const listing = await blockchain.api.query.template.listings(i);
        
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
      showNotification('Failed to load listings', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const loadAllOffers = async () => {
    if (!blockchain.api) return;

    try {
      const nextId = await blockchain.api.query.template.nextOfferId();
      const offerCount = nextId.toNumber();
      
      const loadedOffers: Offer[] = [];

      for (let i = 0; i < offerCount; i++) {
        const offer = await blockchain.api.query.template.offers(i);
        
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
      console.error('Error loading all offers:', error);
    }
  };

  const loadMyOffers = async () => {
    if (!blockchain.api || !blockchain.selectedAccount) return;

    try {
      const offerIds = await blockchain.api.query.template.offersByOfferer(
        blockchain.selectedAccount.address
      );
      
      const loadedOffers: Offer[] = [];
      
      for (const offerId of offerIds) {
        const offer = await blockchain.api.query.template.offers(offerId.toNumber());
        
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
      console.error('Error loading offers:', error);
    }
  };

  const subscribeToEvents = () => {
    if (!blockchain.api) return;

    blockchain.api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;
        
        if (event.section === 'template') {
          if (event.method === 'ListingCreated' || event.method === 'PrivateListingCreated') {
            const [listingId] = event.data;
            saveTransaction({
              type: 'Listing Created',
              listingId: listingId.toString(),
              timestamp: Date.now(),
              status: 'success'
            });
            showNotification('🎉 Listing created successfully!', 'success');
            loadListings();
            loadBalance();
          } else if (event.method === 'TradeCompleted') {
            const [listingId, offerId] = event.data;
            saveTransaction({
              type: 'Trade Completed',
              listingId: listingId.toString(),
              offerId: offerId.toString(),
              timestamp: Date.now(),
              status: 'success'
            });
            showNotification('✨ Trade completed!', 'success');
            loadListings();
            loadMyOffers();
            loadAllOffers();
            loadBalance();
          } else if (event.method === 'OfferMade') {
            const [offerId, listingId] = event.data;
            saveTransaction({
              type: 'Offer Made',
              listingId: listingId.toString(),
              offerId: offerId.toString(),
              timestamp: Date.now(),
              status: 'success'
            });
            showNotification('💼 Offer submitted!', 'success');
            loadMyOffers();
            loadAllOffers();
            loadBalance();
          } else if (event.method === 'ListingCancelled') {
            const [listingId] = event.data;
            saveTransaction({
              type: 'Listing Cancelled',
              listingId: listingId.toString(),
              timestamp: Date.now(),
              status: 'cancelled'
            });
            showNotification('🚫 Listing cancelled', 'success');
            loadListings();
            loadBalance();
          } else if (event.method === 'OfferCancelled') {
            const [offerId] = event.data;
            saveTransaction({
              type: 'Offer Cancelled',
              offerId: offerId.toString(),
              timestamp: Date.now(),
              status: 'cancelled'
            });
            showNotification('🚫 Offer cancelled', 'success');
            loadMyOffers();
            loadAllOffers();
            loadBalance();
          } else if (event.method === 'OfferRejected') {
            const [offerId] = event.data;
            saveTransaction({
              type: 'Offer Rejected',
              offerId: offerId.toString(),
              timestamp: Date.now(),
              status: 'rejected'
            });
            showNotification('❌ Offer rejected', 'error');
            loadMyOffers();
            loadAllOffers();
            loadBalance();
          }
        }
      });
    });
  };

  const createListing = async (formData: any) => {
    if (!blockchain.api || !blockchain.selectedAccount) {
      showNotification('Please connect your wallet first', 'error');
      return;
    }

    try {
      setBlockchain(prev => ({ ...prev, loading: true }));

      const injector = await web3FromAddress(blockchain.selectedAccount.address);

      const resourceType = formData.resourceType.trim();
      const resourceId = formData.resourceId.trim();
      const metadata = formData.metadata.trim();

      let desiredResources = null;
      
      if (formData.desiredResources.length > 0) {
        const validResources = formData.desiredResources.filter((r: any) => 
          r.type.trim() && r.id.trim() && r.metadata.trim()
        );

        if (validResources.length > 0) {
          desiredResources = validResources.map((r: any) => [
            r.type.trim(),
            r.id.trim(),
            r.metadata.trim()
          ]);
        }
      }

      const targetAccount = formData.isPrivate 
        ? (formData.useAddressBook ? formData.selectedContact : formData.targetAccount)
        : null;

      const unsub = await blockchain.api.tx.template
        .createListing(resourceType, resourceId, metadata, desiredResources, targetAccount)
        .signAndSend(
          blockchain.selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError }: any) => {
            if (dispatchError) {
              let errorMsg = 'Transaction failed';
              if (dispatchError.isModule) {
                const decoded = blockchain.api!.registry.findMetaError(dispatchError.asModule);
                errorMsg = `${decoded.section}.${decoded.name}`;
              }
              showNotification(`Error: ${errorMsg}`, 'error');
              setBlockchain(prev => ({ ...prev, loading: false }));
            } else if (status.isInBlock) {
              showNotification('✨ Listing created!', 'success');
              setShowForm(false);
            } else if (status.isFinalized) {
              unsub();
              setBlockchain(prev => ({ ...prev, loading: false }));
            }
          }
        );
    } catch (error: any) {
      console.error('Error:', error);
      showNotification(`Failed: ${error.message || error}`, 'error');
      setBlockchain(prev => ({ ...prev, loading: false }));
    }
  };

  const makeOffer = async (offerData: any) => {
    if (!blockchain.api || !blockchain.selectedAccount || !selectedListingId) {
      showNotification('Please connect wallet first', 'error');
      return;
    }

    try {
      setBlockchain(prev => ({ ...prev, loading: true }));
      const injector = await web3FromAddress(blockchain.selectedAccount.address);

      const listingIdNum = Number(selectedListingId);
      const offeredResources = offerData.resources.map((r: any) => [
        r.type.trim(),
        r.id.trim(),
        r.metadata.trim()
      ]);

      const unsub = await blockchain.api.tx.template
        .makeOffer(listingIdNum, offeredResources)
        .signAndSend(
          blockchain.selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError }: any) => {
            if (dispatchError) {
              showNotification('Transaction failed', 'error');
              setBlockchain(prev => ({ ...prev, loading: false }));
            } else if (status.isInBlock) {
              showNotification('💼 Offer submitted!', 'success');
              setShowOfferModal(false);
            } else if (status.isFinalized) {
              unsub();
              setBlockchain(prev => ({ ...prev, loading: false }));
            }
          }
        );
    } catch (error: any) {
      showNotification(`Failed: ${error.message}`, 'error');
      setBlockchain(prev => ({ ...prev, loading: false }));
    }
  };

  const cancelListing = async (listingId: string) => {
    if (!blockchain.api || !blockchain.selectedAccount) return;

    try {
      setBlockchain(prev => ({ ...prev, loading: true }));
      const injector = await web3FromAddress(blockchain.selectedAccount.address);

      await blockchain.api.tx.template
        .cancelListing(Number(listingId))
        .signAndSend(blockchain.selectedAccount.address, { signer: injector.signer });

      showNotification('Listing cancelled', 'success');
    } catch (error: any) {
      showNotification(`Failed: ${error.message}`, 'error');
    } finally {
      setBlockchain(prev => ({ ...prev, loading: false }));
    }
  };

  const acceptOffer = async (offerId: string) => {
    if (!blockchain.api || !blockchain.selectedAccount) return;

    try {
      setBlockchain(prev => ({ ...prev, loading: true }));
      const injector = await web3FromAddress(blockchain.selectedAccount.address);

      const unsub = await blockchain.api.tx.template
        .acceptOffer(Number(offerId))
        .signAndSend(
          blockchain.selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError }: any) => {
            if (dispatchError) {
              showNotification('Failed to accept offer', 'error');
              setBlockchain(prev => ({ ...prev, loading: false }));
            } else if (status.isInBlock) {
              setAcceptedOfferId(offerId);
              showNotification('✓ Offer accepted! Trade will complete on-chain.', 'success');
            } else if (status.isFinalized) {
              unsub();
              setBlockchain(prev => ({ ...prev, loading: false }));
              setTimeout(() => {
                loadListings();
                loadAllOffers();
              }, 1000);
            }
          }
        );
    } catch (error: any) {
      showNotification(`Failed: ${error.message}`, 'error');
      setBlockchain(prev => ({ ...prev, loading: false }));
    }
  };

  const rejectOffer = async (offerId: string) => {
    if (!blockchain.api || !blockchain.selectedAccount) return;

    try {
      setBlockchain(prev => ({ ...prev, loading: true }));
      const injector = await web3FromAddress(blockchain.selectedAccount.address);

      const unsub = await blockchain.api.tx.template
        .rejectOffer(Number(offerId))
        .signAndSend(
          blockchain.selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError }: any) => {
            if (dispatchError) {
              showNotification('Failed to reject offer', 'error');
              setBlockchain(prev => ({ ...prev, loading: false }));
            } else if (status.isInBlock) {
              showNotification('❌ Offer rejected', 'error');
            } else if (status.isFinalized) {
              unsub();
              setBlockchain(prev => ({ ...prev, loading: false }));
              setTimeout(() => {
                loadAllOffers();
              }, 1000);
            }
          }
        );
    } catch (error: any) {
      showNotification(`Failed: ${error.message}`, 'error');
      setBlockchain(prev => ({ ...prev, loading: false }));
    }
  };

  const cancelOffer = async (offerId: string) => {
    if (!blockchain.api || !blockchain.selectedAccount) return;

    try {
      setBlockchain(prev => ({ ...prev, loading: true }));
      const injector = await web3FromAddress(blockchain.selectedAccount.address);

      const unsub = await blockchain.api.tx.template
        .cancelOffer(Number(offerId))
        .signAndSend(
          blockchain.selectedAccount.address,
          { signer: injector.signer },
          ({ status, dispatchError }: any) => {
            if (dispatchError) {
              showNotification('Failed to cancel offer', 'error');
              setBlockchain(prev => ({ ...prev, loading: false }));
            } else if (status.isInBlock) {
              showNotification('🚫 Offer cancelled', 'success');
            } else if (status.isFinalized) {
              unsub();
              setBlockchain(prev => ({ ...prev, loading: false }));
              setTimeout(() => {
                loadMyOffers();
                loadAllOffers();
              }, 1000);
            }
          }
        );
    } catch (error: any) {
      showNotification(`Failed: ${error.message}`, 'error');
      setBlockchain(prev => ({ ...prev, loading: false }));
    }
  };

  // Local Storage Functions
  const loadTransactions = () => {
    const stored = localStorage.getItem('barterTransactions');
    if (stored) {
      setTransactions(JSON.parse(stored));
    }
  };

  const saveTransaction = (tx: Transaction) => {
    const updated = [tx, ...transactions].slice(0, 50);
    localStorage.setItem('barterTransactions', JSON.stringify(updated));
    setTransactions(updated);
  };

  const loadAddressBook = () => {
    const stored = localStorage.getItem('barterAddressBook');
    if (stored) {
      setAddressBook(JSON.parse(stored));
    }
  };

  const saveAddressBook = (book: AddressBookEntry[]) => {
    localStorage.setItem('barterAddressBook', JSON.stringify(book));
    setAddressBook(book);
  };

  const addContact = () => {
    if (!newContact.name || !newContact.address) {
      showNotification('Please fill in both name and address', 'error');
      return;
    }

    const updated = [...addressBook, newContact];
    saveAddressBook(updated);
    setNewContact({ name: '', address: '' });
    setShowAddContactModal(false);
    showNotification('Contact added successfully', 'success');
  };

  const updateContact = (index: number) => {
    if (!newContact.name || !newContact.address) {
      showNotification('Please fill in both name and address', 'error');
      return;
    }

    const updated = [...addressBook];
    updated[index] = newContact;
    saveAddressBook(updated);
    setNewContact({ name: '', address: '' });
    setEditingContact(null);
    showNotification('Contact updated successfully', 'success');
  };

  const deleteContact = (index: number) => {
    const updated = addressBook.filter((_, i) => i !== index);
    saveAddressBook(updated);
    showNotification('Contact deleted', 'success');
  };

  // UI Helper Functions
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getFilteredListings = () => {
    let filtered = listings;
    const currentAddress = blockchain.selectedAccount?.address;

    if (viewMode === 'myListings') {
      // Show ONLY ACTIVE listings created by current user
      filtered = listings.filter(l => 
        l.owner === currentAddress && l.status === 'Active'
      );
    } else if (viewMode === 'myOffers') {
      // Show only listings where user has made offers
      const myOfferListingIds = myOffers.map(o => o.listingId);
      filtered = listings.filter(l => myOfferListingIds.includes(l.id));
    } else if (viewMode === 'completed') {
      // Show TWO types of completed items:
      // 1. User's own listings that are completed (accepted someone's offer)
      // 2. Offers user made that were accepted by listing owner
      const acceptedOfferListingIds = myOffers
        .filter(o => o.status === 'Accepted')
        .map(o => o.listingId);
      
      filtered = listings.filter(l => {
        // User's own completed listings
        if (l.owner === currentAddress && l.status === 'Completed') return true;
        
        // Listings where user made an accepted offer
        if (acceptedOfferListingIds.includes(l.id)) return true;
        
        return false;
      });
    } else {
      // Show available listings based on visibility rules:
      // 1. Only show Active listings (not Completed or Cancelled)
      // 2. Exclude listings created by current user
      // 3. For private listings, only show if targeted to current user
      // 4. Exclude listings where user has already made an offer
      const myOfferListingIds = myOffers.map(o => o.listingId);
      
      filtered = listings.filter(l => {
        // Must be active
        if (l.status !== 'Active') return false;
        
        // Don't show own listings in available view
        if (l.owner === currentAddress) return false;
        
        // If listing is private, only show if targeted to current user
        if (l.targetAccount && l.targetAccount !== currentAddress) return false;
        
        // Don't show listings where user already has a pending/accepted offer
        if (myOfferListingIds.includes(l.id)) return false;
        
        return true;
      });
    }

    return filtered;
  };

  const getThemeForMode = (mode: ViewMode) => {
    switch(mode) {
      case 'all': return { border: 'border-blue-500/50', bg: 'from-blue-500/10 to-cyan-500/10', text: 'text-blue-400' };
      case 'myOffers': return { border: 'border-green-500/50', bg: 'from-green-500/10 to-emerald-500/10', text: 'text-green-400' };
      case 'myListings': return { border: 'border-yellow-500/50', bg: 'from-yellow-500/10 to-orange-500/10', text: 'text-yellow-400' };
      case 'completed': return { border: 'border-purple-500/50', bg: 'from-purple-500/10 to-pink-500/10', text: 'text-purple-400' };
    }
  };

  const currentTheme = getThemeForMode(viewMode);

  const currentAddress = blockchain.selectedAccount?.address;

  // Calculate user-specific available count
  const availableCount = listings.filter(l => {
    if (l.status !== 'Active') return false;
    if (l.owner === currentAddress) return false;
    if (l.targetAccount && l.targetAccount !== currentAddress) return false;
    const myOfferListingIds = myOffers.map(o => o.listingId);
    if (myOfferListingIds.includes(l.id)) return false;
    return true;
  }).length;

  // Count active listings for current user only
  const myActiveListingsCount = listings.filter(l => 
    l.owner === currentAddress && l.status === 'Active'
  ).length;

  // Count completed items (user's completed listings + accepted offers)
  const acceptedOfferListingIds = myOffers
    .filter(o => o.status === 'Accepted')
    .map(o => o.listingId);
  
  const completedCount = listings.filter(l => {
    if (l.owner === currentAddress && l.status === 'Completed') return true;
    if (acceptedOfferListingIds.includes(l.id)) return true;
    return false;
  }).length;

  const stats = [
    { 
      label: "Available", 
      value: availableCount,
      icon: Boxes,
      gradient: "from-blue-500 to-cyan-500",
      mode: 'all' as ViewMode
    },
    { 
      label: "My Offers", 
      value: myOffers.filter(o => o.status === 'Pending').length, 
      icon: Zap,
      gradient: "from-green-500 to-emerald-500",
      mode: 'myOffers' as ViewMode
    },
    { 
      label: "My Listings", 
      value: myActiveListingsCount,
      icon: Sparkles,
      gradient: "from-yellow-500 to-orange-500",
      mode: 'myListings' as ViewMode
    },
    { 
      label: "Completed", 
      value: completedCount, 
      icon: Check,
      gradient: "from-purple-500 to-pink-500",
      mode: 'completed' as ViewMode
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header */}
      <Header
        connected={blockchain.connected}
        selectedAccount={blockchain.selectedAccount}
        balance={balance}
        showForm={showForm}
        onToggleForm={() => setShowForm(!showForm)}
        onConnectWallet={() => setShowWalletModal(true)}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAddressBook={() => {
          setShowAddressBookModal(true);
          setSidebarOpen(false);
        }}
        onOpenTransactionHistory={() => {
          setShowTransactionHistory(true);
          setSidebarOpen(false);
        }}
        addressBookCount={addressBook.length}
        transactionsCount={transactions.length}
        recentOffers={allOffers}
      />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 relative">
        {!blockchain.connected ? (
          <LoadingSpinner />
        ) : showForm ? (
          <CreateListingModal
            onClose={() => setShowForm(false)}
            onSubmit={createListing}
            isLoading={blockchain.loading}
            addressBook={addressBook}
          />
        ) : (
          <>
            <HeroSection />
            <StatsSection
              stats={stats}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <SearchSection
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onRefresh={loadListings}
              refreshing={refreshing}
            />
            {viewMode === 'myOffers' ? (
              <MyOffersSection
                offers={myOffers}
                listings={listings}
                selectedAccount={blockchain.selectedAccount?.address || null}
                currentTheme={currentTheme}
                isLoading={blockchain.loading}
                onCancelOffer={cancelOffer}
              />
            ) : (
              <>
                <ListingsHeader
                  viewMode={viewMode}
                  count={getFilteredListings().length}
                  theme={currentTheme}
                />
                <ListingsGrid
                  listings={getFilteredListings()}
                  selectedAccount={blockchain.selectedAccount?.address}
                  viewMode={viewMode}
                  currentTheme={currentTheme}
                  searchTerm={searchTerm}
                  isLoading={blockchain.loading}
                  allOffers={allOffers}
                  onMakeOffer={(id) => {
                    setSelectedListingId(id);
                    setShowOfferModal(true);
                  }}
                  onCancelListing={cancelListing}
                  onViewOffers={(id) => {
                    setSelectedListingId(id);
                    setShowViewOffersModal(true);
                  }}
                />
              </>
            )}
          </>
        )}
      </main>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
        />
      )}

      {/* Modals */}
      {showWalletModal && (
        <WalletModal
          onClose={() => setShowWalletModal(false)}
          onConnect={connectWallet}
        />
      )}

      {showOfferModal && (
        <MakeOfferModal
          listingId={selectedListingId}
          onClose={() => {
            setShowOfferModal(false);
            setSelectedListingId(null);
          }}
          onSubmit={makeOffer}
          isLoading={blockchain.loading}
        />
      )}

      {showAddressBookModal && (
        <AddressBookModal
          contacts={addressBook}
          onClose={() => setShowAddressBookModal(false)}
          onAddContact={() => {
            setNewContact({ name: '', address: '' });
            setEditingContact(null);
            setShowAddContactModal(true);
            setShowAddressBookModal(false);
          }}
          onEdit={(index) => {
            setNewContact(addressBook[index]);
            setEditingContact(index);
            setShowAddContactModal(true);
            setShowAddressBookModal(false);
          }}
          onDelete={deleteContact}
        />
      )}

      {showAddContactModal && (
        <AddContactModal
          contact={newContact}
          isEditing={editingContact !== null}
          onClose={() => {
            setShowAddContactModal(false);
            setNewContact({ name: '', address: '' });
            setEditingContact(null);
          }}
          onSubmit={() => {
            if (editingContact !== null) {
              updateContact(editingContact);
            } else {
              addContact();
            }
            setShowAddContactModal(false);
          }}
          onChange={(field, value) => {
            setNewContact(prev => ({ ...prev, [field]: value }));
          }}
        />
      )}

      {showTransactionHistory && (
        <TransactionHistoryModal
          transactions={transactions}
          onClose={() => setShowTransactionHistory(false)}
        />
      )}

      {showViewOffersModal && selectedListingId && (
        <ViewOffersModal
          listing={listings.find(l => l.id === selectedListingId) || null}
          offers={allOffers.filter(o => o.listingId === selectedListingId)}
          onClose={() => {
            setShowViewOffersModal(false);
            setSelectedListingId(null);
            setAcceptedOfferId(null);
          }}
          onAccept={acceptOffer}
          onReject={rejectOffer}
          isLoading={blockchain.loading}
          acceptedOfferId={acceptedOfferId}
        />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
