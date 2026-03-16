import React from 'react';
import { X } from 'lucide-react';

interface AddContactModalProps {
  contact: { name: string; address: string };
  isEditing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (field: 'name' | 'address', value: string) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  contact,
  isEditing,
  onClose,
  onSubmit,
  onChange
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-lg w-full border border-purple-500/30 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Contact' : 'Add Contact'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={contact.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500"
              placeholder="Alice, Bob, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Address</label>
            <input
              type="text"
              value={contact.address}
              onChange={(e) => onChange('address', e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/20 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
              placeholder="5D..."
            />
          </div>
        </div>

        <button
          onClick={onSubmit}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold"
        >
          {isEditing ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  );
};

export default AddContactModal;