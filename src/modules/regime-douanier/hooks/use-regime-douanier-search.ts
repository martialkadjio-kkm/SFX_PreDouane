"use client";

import { create } from "zustand";

interface RegimeDouanierSearchStore {
    search: string;
    setSearch: (search: string) => void;
}

export const useRegimeDouanierSearch = create<RegimeDouanierSearchStore>((set) => ({
    search: "",
    setSearch: (search: string) => set({ search }),
}));
