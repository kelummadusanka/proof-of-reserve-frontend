import React, { useState } from 'react';
import { ApiPromise } from '@polkadot/api';
import { X, Plus, Sparkles, ArrowRight, User } from 'lucide-react';
import { TrustBadge } from '../ui/TrustBadge';

interface MakeOfferModalProps {
  listingId: string | null;
  listingOwner?: string;
  onClose: () => void;
  onSubmit: (offerData: any) => Promise<void>;
  isLoading: boolean;
  api?: ApiPromise | null;
}

export const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  listingId,
  listingOwner,
  onClose,
  onSubmit,
  isLoading,
  api = null,
}) => {
  const [offerData, setOfferData] = useState({
    resources: [{ type: '', id: '', metadata: '' }]
  });

  const addOfferResource = () => {
    if (offerData.resources.length >= 10) {
      return;
    }
    setOfferData(prev => ({
      resources: [...prev.resources, { type: '', id: '', metadata: '' }]
    }));
  };

  const removeOfferResource = (index: number) => {
    setOfferData(prev => ({
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-2xl w-full border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white">Make Offer</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Listing info + lister trust score */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 border border-purple-500/20 space-y-2">
          <p className="text-gray-300 text-sm">Listing ID: <span className="text-purple-400 font-bold">#{listingId}</span></p>
          {listingOwner && (
            <div className="flex items-center gap-2 flex-wrap">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-xs">Lister:</span>
              <span className="text-gray-200 font-mono text-xs">{listingOwner.slice(0, 10)}...{listingOwner.slice(-8)}</span>
              <TrustBadge api={api} address={listingOwner} />
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-300 uppercase">Your Resources</label>
            <button
              onClick={addOfferResource}
              disabled={offerData.resources.length >= 10}
              className="text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {offerData.resources.map((resource, index) => (
            <div key={index} className="p-5 bg-slate-800/50 rounded-2xl border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-purple-400 font-bold">Resource {index + 1}</span>
                {offerData.resources.length > 1 && (
                  <button
                    onClick={() => removeOfferResource(index)}
                    className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={resource.type}
                  onChange={(e) => {
                    const newResources = [...offerData.resources];
                    newResources[index].type = e.target.value;
                    setOfferData({ resources: newResources });
                  }}
                  maxLength={256}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Type"
                />
                <input
                  type="text"
                  value={resource.id}
                  onChange={(e) => {
                    const newResources = [...offerData.resources];
                    newResources[index].id = e.target.value;
                    setOfferData({ resources: newResources });
                  }}
                  maxLength={256}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="ID"
                />
                <input
                  type="text"
                  value={resource.metadata}
                  onChange={(e) => {
                    const newResources = [...offerData.resources];
                    newResources[index].metadata = e.target.value;
                    setOfferData({ resources: newResources });
                  }}
                  maxLength={256}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Description"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onSubmit(offerData)}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Submit Offer
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MakeOfferModal;