"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { columns } from "../components/colums";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { DataPagination } from "@/components/data-pagination";
import { useMemo, useState } from "react";
import { useDevisesSearch } from "../../hooks/use-devises-search";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from "@/constants";

type VDevise = {
  idDevise: number;
  codeDevise: string;
  libelleDevise: string;
  decimales: number;
  dateCreation: Date | string;
  nomCreation: string | null;
};

type Props = {
  devises: VDevise[];
  total?: number;
  currentPage?: number;
};


export const DevisesView = ({ devises, total = 0, currentPage = DEFAULT_PAGE }: Props) => {
  const router = useRouter();
  const { search } = useDevisesSearch();
  const [page, setPage] = useState(currentPage || DEFAULT_PAGE);

  const pageSize = DEFAULT_PAGE_SIZE;

  // Filtrer les données localement
  const filteredDevises = useMemo(() => {
    if (!search) return devises;

    const searchLower = search.toLowerCase();
    return devises.filter((c) =>
      c.codeDevise?.toLowerCase().includes(searchLower) ||
      c.libelleDevise?.toLowerCase().includes(searchLower)
    );
  }, [devises, search]);
  // Paginer les données filtrées
  const paginatedDevises = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredDevises.slice(startIndex, endIndex);
  }, [filteredDevises, page, pageSize]);

  const totalPages = filteredDevises.length > 0 ? Math.ceil(filteredDevises.length / pageSize) : 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {paginatedDevises && paginatedDevises.length > 0 && (
        <DataTable
          data={paginatedDevises}
          columns={columns}
          onRowClick={(row) => router.push(`/devises/${row.idDevise}`)}
        />
      )}

      <DataPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      {filteredDevises?.length === 0 && (
        <EmptyState
          title={search ? "Aucun code devises trouvé" : "Creer votre premier code devises"}
          description={search ? `Aucun résultat pour "${search}"` : "Il n'y a pas encore de codes devises dans votre compte."}
        />
      )}
    </div>
  );
};

export const DevisesLoadingView = () => {
  return (
    <LoadingState
      title="Chargement des  devises"
      description="Ceci peut prendre quelques secondes..."
    />
  );
};

export const DevisesErrorView = () => {
  return (
    <ErrorState
      title="Erreur du chargements des  devises"
      description="Quelque chose n'a pas marcher lors du chargement des devises. Veuillez reessayer."
    />
  );
};
