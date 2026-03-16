import React, { useState } from 'react';
import { X, Plus, Sparkles, ArrowRight } from 'lucide-react';
import { AddressBookEntry } from '../../types';

interface CreateListingModalProps {
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
  addressBook: AddressBookEntry[];
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  onClose,
  onSubmit,
  isLoading,
  addressBook
}) => {
  const [formData, setFormData] = useState({
    resourceType: '',
    resourceId: '',
    metadata: '',
    desiredResources: [] as Array<{type: string, id: string, metadata: string}>,
    isPrivate: false,
    targetAccount: '',
    useAddressBook: false,
    selectedContact: ''
  });

  const addDesiredResource = () => {
    if (formData.desiredResources.length >= 10) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      desiredResources: [...prev.desiredResources, { type: '', id: '', metadata: '' }]
    }));
  };

  const removeDesiredResource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      desiredResources: prev.desiredResources.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl p-10 border border-purple-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white">Create New Listing</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-gray-300 uppercase">Resource Type *</label>
              <span className="text-xs font-semibold text-gray-500">{formData.resourceType.length}/256</span>
            </div>
            <input
              type="text"
              value={formData.resourceType}
              onChange={(e) => setFormData(prev => ({ ...prev, resourceType: e.target.value }))}
              maxLength={256}
              className="w-full px-5 py-4 bg-slate-800/50 border border-purple-500/30 rounded-2xl text-white focus:outline-none focus:border-purple-500"
              placeholder="NFT, GameItem, Token..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-gray-300 uppercase">Resource ID *</label>
              <span className="text-xs font-semibold text-gray-500">{formData.resourceId.length}/256</span>
            </div>
            <input
              type="text"
              value={formData.resourceId}
              onChange={(e) => setFormData(prev => ({ ...prev, resourceId: e.target.value }))}
              maxLength={256}
              className="w-full px-5 py-4 bg-slate-800/50 border border-purple-500/30 rounded-2xl text-white focus:outline-none focus:border-purple-500"
              placeholder="CryptoKitty#1234..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-gray-300 uppercase">Description *</label>
              <span className="text-xs font-semibold text-gray-500">{formData.metadata.length}/256</span>
            </div>
            <textarea
              value={formData.metadata}
              onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
              maxLength={256}
              className="w-full px-5 py-4 bg-slate-800/50 border border-purple-500/30 rounded-2xl text-white focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Rare collectible..."
              rows={4}
            />
          </div>

          <div className="p-5 bg-slate-800/30 rounded-2xl border border-cyan-500/20">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                className="w-5 h-5 rounded"
              />
              <div>
                <span className="text-sm font-bold text-cyan-300 uppercase">Private Listing</span>
                <p className="text-xs text-gray-400 mt-1">Only specific account can make offers</p>
              </div>
            </label>
            
            {formData.isPrivate && (
              <>
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={formData.useAddressBook}
                    onChange={(e) => setFormData(prev => ({ ...prev, useAddressBook: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-cyan-200">Use Address Book</span>
                </label>

                {formData.useAddressBook ? (
                  <select
                    value={formData.selectedContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, selectedContact: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-xl text-white text-sm focus:outline-none"
                  >
                    <option value="">Select contact...</option>
                    {addressBook.map((contact, index) => (
                      <option key={index} value={contact.address}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.targetAccount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAccount: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-xl text-white text-sm focus:outline-none"
                    placeholder="Target address (5D...)"
                  />
                )}
              </>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-gray-300 uppercase">Desired Resources (Optional)</label>
              <button
                onClick={addDesiredResource}
                disabled={formData.desiredResources.length >= 10}
                className="text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {formData.desiredResources.map((resource, index) => (
                <div key={index} className="p-5 bg-slate-800/50 rounded-2xl border border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-purple-400 font-bold">Item {index + 1}</span>
                    <button
                      onClick={() => removeDesiredResource(index)}
                      className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={resource.type}
                      onChange={(e) => {
                        const newResources = [...formData.desiredResources];
                        newResources[index].type = e.target.value;
                        setFormData(prev => ({ ...prev, desiredResources: newResources }));
                      }}
                      maxLength={256}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none"
                      placeholder="Type"
                    />
                    <input
                      type="text"
                      value={resource.id}
                      onChange={(e) => {
                        const newResources = [...formData.desiredResources];
                        newResources[index].id = e.target.value;
                        setFormData(prev => ({ ...prev, desiredResources: newResources }));
                      }}
                      maxLength={256}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none"
                      placeholder="ID"
                    />
                    <input
                      type="text"
                      value={resource.metadata}
                      onChange={(e) => {
                        const newResources = [...formData.desiredResources];
                        newResources[index].metadata = e.target.value;
                        setFormData(prev => ({ ...prev, desiredResources: newResources }));
                      }}
                      maxLength={256}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white text-sm focus:outline-none"
                      placeholder="Description"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onSubmit(formData)}
            disabled={!formData.resourceType || !formData.resourceId || !formData.metadata || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Create Listing
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateListingModal;
