import React from 'react';
import { X, BookOpen, UserPlus, Edit2, Trash2, Users } from 'lucide-react';
import { AddressBookEntry } from '../../types';

interface AddressBookModalProps {
  contacts: AddressBookEntry[];
  onClose: () => void;
  onAddContact: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({
  contacts,
  onClose,
  onAddContact,
  onEdit,
  onDelete
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-3xl w-full border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white">Address Book</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <button
          onClick={onAddContact}
          className="w-full mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add New Contact
        </button>

        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No contacts yet</p>
            </div>
          ) : (
            contacts.map((contact, index) => (
              <div key={index} className="p-5 bg-slate-800/50 rounded-2xl border border-purple-500/20 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg">{contact.name}</p>
                  <p className="text-gray-400 text-sm font-mono truncate">{contact.address}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEdit(index)}
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(index)}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressBookModal;
