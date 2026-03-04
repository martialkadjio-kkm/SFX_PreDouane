"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RegimeDouanierSearch } from "./regime-douanier-search-filters";
import { NewRegimeDialog } from "./new-regime-dialog";


const RegimeDouanierListHeader = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const regimeId = searchParams.get("regimeId") || "";
  const isAnyFilterModified = !!search || !!regimeId;

  const onClearFilters = () => {
    router.push("?page=1");
  };

  return (
    <>
      <NewRegimeDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">Mes Regimes</h5>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon />
            Nouveau Regime Douanier
          </Button>
        </div>
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <RegimeDouanierSearch />
            {isAnyFilterModified && (
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

export default RegimeDouanierListHeader;
