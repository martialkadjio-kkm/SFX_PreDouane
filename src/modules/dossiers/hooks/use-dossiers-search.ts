"use client";

import { useQueryState } from "nuqs";

export const useDossiersSearch = () => {
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
        shallow: false,
    });

    return { search, setSearch };
};
