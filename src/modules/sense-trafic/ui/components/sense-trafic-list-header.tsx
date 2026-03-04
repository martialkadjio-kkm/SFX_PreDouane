"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewSenseTraficDialog } from "./new-sense-trafic-dialog";
import { SenseTraficSearchFilter } from "./sense-trafic-search-filter";
import { NewHscodeDialog } from "@/modules/hscode/ui/components/new-hscode-dialog";


export const SenseTraficListHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNewSenseTraficDialogOpen, setIsNewSenseTraficDialogOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const senseTrafic = searchParams.get("senseTrafic") || "";
  const isAnyFilterModified = !!search || !!senseTrafic;

  const onSenseFilters = () => {
    router.push("?page=1");
  };

  return (
    <>
      <NewSenseTraficDialog open={isNewSenseTraficDialogOpen} onOpenChange={setIsNewSenseTraficDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">Mes Sense Trafic</h5>
          <Button onClick={() => setIsNewSenseTraficDialogOpen(true)}>
            <PlusIcon />
            Nouveau Sense Trafic
          </Button>
        </div>
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <SenseTraficSearchFilter />
            {isAnyFilterModified && (
              <Button onClick={onSenseFilters} variant="outline">
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