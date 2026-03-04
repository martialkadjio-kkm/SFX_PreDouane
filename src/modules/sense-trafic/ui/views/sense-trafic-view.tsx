"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { columns } from "../components/columns";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { TSensTrafic } from "@/generated/prisma";
import { DataPagination } from "@/components/data-pagination";
import { useMemo, useState } from "react";
import { useSenseTraficSearch } from "../../hooks/use-sense-trafic-search";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from "@/constants";


type Props = {
  senseTrafic: TSensTrafic[];
  total?: number;
  currentPage?: number;
};


export const SenceTraficView = ({ senseTrafic, total = 0, currentPage = DEFAULT_PAGE }: Props) => {
  const router = useRouter();
  const { search } = useSenseTraficSearch();
  const [page, setPage] = useState(currentPage || DEFAULT_PAGE);

  const pageSize = DEFAULT_PAGE_SIZE;

  // Filtrer les données localement
  const filteredSenseTrafic = useMemo(() => {
    if (!search) return senseTrafic;

    const searchLower = search.toLowerCase();
    return senseTrafic.filter(c =>
      c.libelle?.toLowerCase().includes(searchLower)
    );
  }, [senseTrafic, search]);

  // Paginer les données filtrées
  const paginatedSenseTrafic = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredSenseTrafic.slice(startIndex, endIndex);
  }, [filteredSenseTrafic, page, pageSize]);

  const totalPages = filteredSenseTrafic.length > 0 ? Math.ceil(filteredSenseTrafic.length / pageSize) : 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {paginatedSenseTrafic && paginatedSenseTrafic.length > 0 && (
        <DataTable
          data={paginatedSenseTrafic}
          columns={columns}
          onRowClick={(row) => router.push(`/sense-trafic/${row.id}`)}
        />
      )}

      <DataPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      {filteredSenseTrafic?.length === 0 && (
        <EmptyState
          title={search ? "Aucun sence trafic trouvé" : "Creer votre premier sence trafic"}
          description={search ? `Aucun résultat pour "${search}"` : "Il n'y a pas encore de sence trafic dans votre compte."}
        />
      )}
    </div>
  );
};

export const SenceTraficLoadingView = () => {
  return (
    <LoadingState
      title="Chargement des sence trafic"
      description="Ceci peut prendre quelques secondes..."
    />
  );
};

export const SenceTraficErrorView = () => {
  return (
    <ErrorState
      title="Erreur du chargements des sence trafic"
      description="Quelque chose n'a pas marcher lors du chargement des sence trafic. Veuillez reessayer."
    />
  );
};
