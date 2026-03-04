"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { columns } from "../components/columns";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { Etape } from "@/generated/prisma";
import { DataPagination } from "@/components/data-pagination";
import { useMemo, useState } from "react";
import { useEtapeSearch } from "../../hooks/use-etape-search";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from "@/constants";

type Props = {
  etapes: Etape[];
  total?: number;
  currentPage?: number;
};

export const EtapeView = ({ etapes, total = 0, currentPage = DEFAULT_PAGE }: Props) => {
  const router = useRouter();
  const { search } = useEtapeSearch();
  const [page, setPage] = useState(currentPage || DEFAULT_PAGE);

  const pageSize = DEFAULT_PAGE_SIZE;

  // Filtrer les données localement
  const filteredEtapes = useMemo(() => {
    if (!search) return etapes;

    const searchLower = search.toLowerCase();
    return etapes.filter((e) =>
      e.nom?.toLowerCase().includes(searchLower) ||
      e.description?.toLowerCase().includes(searchLower)
    );
  }, [etapes, search]);

  // Paginer les données filtrées
  const paginatedEtapes = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredEtapes.slice(startIndex, endIndex);
  }, [filteredEtapes, page, pageSize]);

  const totalPages =
    filteredEtapes.length > 0
      ? Math.ceil(filteredEtapes.length / pageSize)
      : 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {paginatedEtapes && paginatedEtapes.length > 0 && (
        <DataTable
          data={paginatedEtapes}
          columns={columns}
          onRowClick={(row) => router.push(`/etape/${row.id}`)}
        />
      )}

      <DataPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {filteredEtapes?.length === 0 && (
        <EmptyState
          title={search ? "Aucune étape trouvée" : "Créez votre première étape"}
          description={
            search
              ? `Aucun résultat pour "${search}"`
              : "Il n'y a pas encore d'étapes enregistrées."
          }
        />
      )}
    </div>
  );
};

export const EtapeLoadingView = () => {
  return (
    <LoadingState
      title="Chargement des étapes"
      description="Ceci peut prendre quelques secondes..."
    />
  );
};

export const EtapeErrorView = () => {
  return (
    <ErrorState
      title="Erreur lors du chargement des étapes"
      description="Une erreur est survenue lors du chargement. Veuillez réessayer."
    />
  );
};
