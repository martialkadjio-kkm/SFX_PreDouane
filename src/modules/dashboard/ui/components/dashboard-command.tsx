"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Users, Package, Loader2 } from "lucide-react";

import {
    CommandInput,
    CommandList,
    CommandItem,
    CommandGroup,
    CommandEmpty,
    CommandResponsiveDialog
} from "@/components/ui/command";

import { globalSearch, SearchResult } from "../../server/global-search-actions";

interface Props {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Grouper les résultats par type - APRÈS la déclaration de results
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.type]) {
            acc[result.type] = [];
        }
        acc[result.type].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    useEffect(() => {
        console.log('🎯 [DashboardCommand] État des résultats:', {
            query,
            resultsLength: results.length,
            isLoading,
            groupedResultsKeys: Object.keys(groupedResults),
            results: results.slice(0, 3) // Premiers 3 résultats pour debug
        });
    }, [results, query, isLoading, groupedResults]);

    useEffect(() => {
        const searchData = async () => {
            if (query.length < 2) {
                setResults([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            console.log('🔍 Recherche pour:', query);
            try {
                const response = await globalSearch(query);
                console.log('📊 Réponse de recherche:', response);
                if (response.success && response.data) {
                    console.log('✅ Résultats trouvés:', response.data.length);
                    setResults(response.data);
                } else {
                    console.log('❌ Aucun résultat ou erreur:', response.error);
                    setResults([]);
                }
            } catch (error) {
                console.error("Search error:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Montrer le loading immédiatement si on a assez de caractères
        if (query.length >= 2) {
            setIsLoading(true);
        }

        const debounceTimer = setTimeout(searchData, 200);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleSelect = (url: string) => {
        setOpen(false);
        setQuery("");
        setResults([]);
        router.push(url);
    };

    const getIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'client':
                return <Users className="w-4 h-4" />;
            case 'dossier':
                return <FileText className="w-4 h-4" />;
            case 'hscode':
                return <Package className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: SearchResult['type']) => {
        switch (type) {
            case 'client':
                return 'Clients';
            case 'dossier':
                return 'Dossiers';
            case 'hscode':
                return 'HS Codes';
            default:
                return '';
        }
    };

    return (
        <CommandResponsiveDialog 
            key={`search-${open}`} // Force re-render when opening
            open={open} 
            onOpenChange={setOpen}
            shouldFilter={false}
        >
            <div className="relative">
                <CommandInput
                    placeholder="Rechercher clients, dossiers, HS codes..."
                    value={query}
                    onValueChange={setQuery}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>
            <CommandList>
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Recherche en cours...</span>
                    </div>
                )}
                
                {!isLoading && query.length >= 2 && results.length === 0 && (
                    <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                )}

                {!isLoading && results.length > 0 && Object.entries(groupedResults).map(([type, typeResults]) => (
                    <CommandGroup key={type} heading={getTypeLabel(type as SearchResult['type'])}>
                        {typeResults.map((result) => (
                            <CommandItem
                                key={result.id}
                                onSelect={() => handleSelect(result.url)}
                                className="flex items-center gap-3 p-3 cursor-pointer"
                            >
                                {getIcon(result.type)}
                                <div className="flex flex-col">
                                    <span className="font-medium">{result.title}</span>
                                    {result.subtitle && (
                                        <span className="text-sm text-muted-foreground">
                                            {result.subtitle}
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}

                {query.length < 2 && (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                        Tapez au moins 2 caractères pour rechercher
                    </div>
                )}
            </CommandList>
        </CommandResponsiveDialog>
    );
};