"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewPaysDialog } from "./new-pays-dialog";
import { PaysSearchFilter } from "./pays-search-filter";

export const PaysListHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNewPaysDialogOpen, setIsNewPaysDialogOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const pays = searchParams.get("pays") || "";
  const isAnyFilterModified = !!search || !!pays;
  const onPaysFilters = () => {
    router.push("?page=1");
  };

  return (
    <>
      <NewPaysDialog open={isNewPaysDialogOpen} onOpenChange={setIsNewPaysDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">Mes Pays</h5>
          <Button onClick={() => setIsNewPaysDialogOpen(true)}>
            <PlusIcon />
            Nouveau Pays
          </Button>
        </div>
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <PaysSearchFilter />
            {isAnyFilterModified && (
              <Button onClick={onPaysFilters} variant="outline">
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
