"use client";

import { create } from "zustand";

interface TransitOrdersSearchStore {
    search: string;
    setSearch: (search: string) => void;
}

export const useTransitOrdersSearch = create<TransitOrdersSearchStore>((set) => ({
    search: "",
    setSearch: (search: string) => set({ search }),
}));
