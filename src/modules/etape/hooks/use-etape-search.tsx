"use client";

import { create } from "zustand";

interface EtapeSearchStore {
    search: string;
    setSearch: (value: string) => void;
}

export const useEtapeSearch = create<EtapeSearchStore>((set) => ({
    search: "",
    setSearch: (value: string) => set({ search: value }),
}));
