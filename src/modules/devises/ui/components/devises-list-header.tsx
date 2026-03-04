"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewDevisesDialog } from "./new-devises-dialog";
import { DevisesSearchFilter } from "./devises-search-filter";

export const DevisesListHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNewDevisesDialogOpen, setIsNewDevisesDialogOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const devises = searchParams.get("devises") || "";
  const isAnyFilterModified = !!search || !!devises;

  const onDevisesFilters = () => {
    router.push("?page=1");
  };

  return (
    <>
      <NewDevisesDialog open={isNewDevisesDialogOpen} onOpenChange={setIsNewDevisesDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">Mes Devises</h5>
          <Button onClick={() => setIsNewDevisesDialogOpen(true)}>
            <PlusIcon />
            Nouveau Devise
          </Button>
        </div>
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <DevisesSearchFilter />
            {isAnyFilterModified && (
              <Button onClick={onDevisesFilters} variant="outline">
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
