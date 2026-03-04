"use client";

import { DataTable } from "@/components/data-table";
import { DataPagination } from "@/components/data-pagination";
import { createColumns } from "../components/columns";
import { LoadingState } from "@/components/laoding-state";
import { ErrorState } from "@/components/error-state";
import { ColisageImportGlobal } from "../components/colisage-import-global";
import { ColisageBulkActions } from "../components/colisage-bulk-actions";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useColisageSearch } from "../../hooks/use-colisage-search";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ColisageData {
  id: string;
  description: string;
  numeroCommande?: string | null;
  nomFournisseur?: string | null;
  quantite: number;
  poidsBrut: number;
  createdAt: Date;
}

interface ColisageViewProps {
  colisages: ColisageData[];
  total: number;
  currentPage: number;
}

export const ColisageView = ({
  colisages,
  total,
  currentPage,
}: ColisageViewProps) => {
  const pageSize = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { search, setSearch } = useColisageSearch();

  // Éviter l'hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();

  // Filtrer les données localement
  const filteredColisages = useMemo(() => {
    if (!isMounted || !search) return colisages;

    const searchLower = search.toLowerCase();
    return colisages.filter(c =>
      c.description?.toLowerCase().includes(searchLower) ||
      c.numeroCommande?.toLowerCase().includes(searchLower) ||
      c.nomFournisseur?.toLowerCase().includes(searchLower)
    );
  }, [colisages, search, isMounted]);

  // Paginer les données filtrées
  const paginatedColisages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredColisages.slice(startIndex, endIndex);
  }, [filteredColisages, currentPage, pageSize]);

  const totalPages = filteredColisages.length > 0 ? Math.ceil(filteredColisages.length / pageSize) : 1;

  const handlePageChange = (page: number) => {
    router.push(`?page=${page}`);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    // Reset après un court délai pour l'animation
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const columns = createColumns(selectedIds, setSelectedIds);

  return (
    <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        <ColisageImportGlobal />
      </div>

      {selectedIds.length > 0 && (
        <ColisageBulkActions
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          totalCount={filteredColisages.length}
        />
      )}

      <DataTable
        columns={columns}
        data={paginatedColisages}
        onRowClick={(row) => router.push(`/colisage/${row.id}`)}
      />
      <DataPagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export const ColisageLoadingView = () => {
  return (
    <LoadingState
      title="Chargements des colisages"
      description="Ceci peut prendre quelques secondes..."
    />
  );
};

export const ColisageErrorView = () => {
  return (
    <ErrorState
      title="Erreur du chargements des colisages"
      description="Quelque chose n'a pas marcher lors du chargement des colisages. Veuillez reessayer."
    />
  );
};
