"use client";

import { create } from "zustand";

interface PaysSearchStore {
    search: string;
    setSearch: (search: string) => void;
}

export const usePaysSearch = create<PaysSearchStore>((set) => ({
    search: "",
    setSearch: (search: string) => set({ search }),
}));
