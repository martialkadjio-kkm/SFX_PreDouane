"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusIcon, XCircleIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useTransitOrdersSearch } from "../../hooks/use-transit-orders-search";
import { NewOrderTransitDialog } from "./new-order-transit-dialog";

const TransitOrdersHeader = () => {
    const { search, setSearch } = useTransitOrdersSearch();
    const [inputValue, setInputValue] = useState(search);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSearch = (value: string) => {
        setInputValue(value);
        setSearch(value);
    };

    const onClearFilters = () => {
        setInputValue("");
        setSearch("");
    };

    return (
        <>
            <NewOrderTransitDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                    <h5 className="font-medium text-xl">Ordres de Transit</h5>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusIcon />
                        Nouvel Ordre
                    </Button>
                </div>
                <ScrollArea>
                    <div className="flex items-center gap-x-2 p-1">
                        <div className="relative">
                            <Input
                                placeholder="Rechercher un ordre..."
                                className="h-9 bg-white w-[250px] pl-7"
                                value={inputValue}
                                onChange={e => handleSearch(e.target.value)}
                            />
                            <SearchIcon className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        {search && (
                            <Button onClick={onClearFilters} variant="outline">
                                <XCircleIcon className="text-destructive!" />
                                Effacer les filtres
                            </Button>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </>
    );
};

export default TransitOrdersHeader;
