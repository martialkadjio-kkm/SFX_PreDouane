"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewEtapeDialog } from "./new-etape-dialog";          
import { EtapeSearchFilter } from "./etape-search-filter";     

export const EtapeListHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNewEtapeDialogOpen, setIsNewEtapeDialogOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const etape = searchParams.get("etape") || "";
  const isAnyFilterModified = !!search || !!etape;

  const onEtapeFilters = () => {
    router.push("?page=1");
  };

  return (
    <>
      <NewEtapeDialog open={isNewEtapeDialogOpen} onOpenChange={setIsNewEtapeDialogOpen} />

      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">Mes Étapes</h5>
          <Button onClick={() => setIsNewEtapeDialogOpen(true)}>
            <PlusIcon />
            Nouvelle étape
          </Button>
        </div>

        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <EtapeSearchFilter />
            {isAnyFilterModified && (
              <Button onClick={onEtapeFilters} variant="outline">
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
