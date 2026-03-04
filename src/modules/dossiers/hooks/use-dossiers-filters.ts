"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const useDossiersFilters = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const search = searchParams.get("search") || "";
    const statutId = searchParams.get("statutId") ? parseInt(searchParams.get("statutId")!) : null;
    const etapeId = searchParams.get("etapeId") ? parseInt(searchParams.get("etapeId")!) : null;

    const updateURL = useCallback((params: Record<string, string | null>) => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === "") {
                newSearchParams.delete(key);
            } else {
                newSearchParams.set(key, value);
            }
        });

        router.push(`/dossiers?${newSearchParams.toString()}`);
    }, [router, searchParams]);

    const setSearch = useCallback((search: string) => {
        updateURL({ search });
    }, [updateURL]);

    const setStatutId = useCallback((statutId: number | null) => {
        updateURL({ statutId: statutId?.toString() || null });
    }, [updateURL]);

    const setEtapeId = useCallback((etapeId: number | null) => {
        updateURL({ etapeId: etapeId?.toString() || null });
    }, [updateURL]);

    const clearFilters = useCallback(() => {
        updateURL({ search: null, statutId: null, etapeId: null });
    }, [updateURL]);

    return {
        search,
        statutId,
        etapeId,
        setSearch,
        setStatutId,
        setEtapeId,
        clearFilters,
    };
};