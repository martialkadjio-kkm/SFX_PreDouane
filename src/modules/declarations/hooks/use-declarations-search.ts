"use client";

import { create } from "zustand";

interface DeclarationsSearchStore {
    search: string;
    setSearch: (search: string) => void;
}

export const useDeclarationsSearch = create<DeclarationsSearchStore>((set) => ({
    search: "",
    setSearch: (search: string) => set({ search }),
}));