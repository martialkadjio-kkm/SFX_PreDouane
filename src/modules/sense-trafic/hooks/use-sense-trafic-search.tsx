"use client";

import { create } from "zustand";

interface SenseTraficSearchStore {
    search: string;
    setSearch: (search: string) => void;
}

export const useSenseTraficSearch = create<SenseTraficSearchStore>((set) => ({
    search: "",
    setSearch: (search: string) => set({ search }),
}));