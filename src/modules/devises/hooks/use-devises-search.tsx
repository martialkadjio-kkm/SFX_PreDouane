"use client";

import { create } from "zustand";

interface DevisesSearchStore {
    search: string;
    setSearch: (search: string) => void;
}

export const useDevisesSearch = create<DevisesSearchStore>((set) => ({
    search: "",
    setSearch: (search: string) => set({ search }),
}));
