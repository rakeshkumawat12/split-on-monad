import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAddressBook = create(
  persist(
    (set, get) => ({
      // { [address]: name }
      contacts: {},

      saveName: (address, name) =>
        set((state) => ({
          contacts: {
            ...state.contacts,
            [address.toLowerCase()]: name,
          },
        })),

      removeName: (address) =>
        set((state) => {
          const contacts = { ...state.contacts };
          delete contacts[address.toLowerCase()];
          return { contacts };
        }),

      getName: (address) => {
        if (!address) return null;
        return get().contacts[address.toLowerCase()] || null;
      },

      getAllContacts: () => {
        const contacts = get().contacts;
        return Object.entries(contacts).map(([address, name]) => ({
          address,
          name,
        }));
      },
    }),
    {
      name: "monad-splitter-address-book",
    }
  )
);

export default useAddressBook;
