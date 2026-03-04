"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { columns, VPays } from "../components/columns";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { DataPagination } from "@/components/data-pagination";
import { useMemo, useState } from "react";
import { usePaysSearch } from "../../hooks/use-pays-search";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from "@/constants";

type Props = {
  pays: VPays[];
  total?: number;
  currentPage?: number;
};

export const PaysView = ({ pays, currentPage = DEFAULT_PAGE }: Props) => {
  const router = useRouter();
  const { search } = usePaysSearch();
  const [page, setPage] = useState(currentPage || DEFAULT_PAGE);

  const pageSize = DEFAULT_PAGE_SIZE;

  const filteredPays = useMemo(() => {
    if (!search) return pays;

    const searchLower = search.toLowerCase();
    return pays.filter(
      (c) =>
        c.codePays?.toLowerCase().includes(searchLower) ||
        c.libellePays?.toLowerCase().includes(searchLower)
    );
  }, [pays, search]);

  const paginatedPays = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredPays.slice(startIndex, endIndex);
  }, [filteredPays, page, pageSize]);

  const totalPages =
    filteredPays.length > 0 ? Math.ceil(filteredPays.length / pageSize) : 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {paginatedPays.length > 0 && (
        <DataTable
          data={paginatedPays}
          columns={columns}
          onRowClick={(row) => router.push(`/pays/${row.idPays}`)}
        />
      )}

      <DataPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      {filteredPays.length === 0 && (
        <EmptyState
          title={search ? "Aucun code pays trouve" : "Creer votre premier code pays"}
          description={
            search
              ? `Aucun resultat pour "${search}"`
              : "Il n'y a pas encore de codes pays dans votre compte."
          }
        />
      )}
    </div>
  );
};

export const PaysLoadingView = () => {
  return (
    <LoadingState
      title="Chargement des pays"
      description="Ceci peut prendre quelques secondes..."
    />
  );
};

export const PaysErrorView = () => {
  return (
    <ErrorState
      title="Erreur du chargement des pays"
      description="Quelque chose n'a pas marche lors du chargement des pays. Veuillez reessayer."
    />
  );
};
