import { useState, useEffect } from 'react';
import { AddressBookEntry } from '../types/offer.types';

export const useAddressBook = () => {
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('barterAddressBook');
    if (stored) {
      setAddressBook(JSON.parse(stored));
    }
  }, []);

  const saveAddressBook = (book: AddressBookEntry[]) => {
    localStorage.setItem('barterAddressBook', JSON.stringify(book));
    setAddressBook(book);
  };

  const addContact = (contact: AddressBookEntry) => {
    const updated = [...addressBook, contact];
    saveAddressBook(updated);
  };

  const updateContact = (index: number, contact: AddressBookEntry) => {
    const updated = [...addressBook];
    updated[index] = contact;
    saveAddressBook(updated);
  };

  const deleteContact = (index: number) => {
    const updated = addressBook.filter((_, i) => i !== index);
    saveAddressBook(updated);
  };

  return {
    addressBook,
    addContact,
    updateContact,
    deleteContact
  };
};