"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { columns, DeclarationRecord } from "../components/columns";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { DataPagination } from "@/components/data-pagination";
import { useMemo, useState } from "react";
import { useDeclarationsSearch } from "../../hooks/use-declarations-search";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from "@/constants";

type Props = {
  declaration: DeclarationRecord[];
  total?: number;
  currentPage?: number;
};

export const DeclarationView = ({
  declaration,
  currentPage = DEFAULT_PAGE,
}: Props) => {
  const router = useRouter();
  const { search } = useDeclarationsSearch();
  const [page, setPage] = useState(currentPage || DEFAULT_PAGE);

  const pageSize = DEFAULT_PAGE_SIZE;

  const filteredDeclarations = useMemo(() => {
    if (!search) return declaration;

    const searchLower = search.toLowerCase();

    return declaration.filter((c) => {
      const num = c.numeroDeclaration?.toLowerCase() ?? "";
      const status = c.statut?.toLowerCase() ?? "";
      const dateRaw = c.createdAt || c.dateDeclaration;
      const dateStr = dateRaw ? new Date(dateRaw).toLocaleDateString("fr-FR") : "";

      return (
        num.includes(searchLower) ||
        status.includes(searchLower) ||
        dateStr.toLowerCase().includes(searchLower)
      );
    });
  }, [declaration, search]);

  const paginatedDeclarations = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredDeclarations.slice(startIndex, endIndex);
  }, [filteredDeclarations, page, pageSize]);

  const totalPages =
    filteredDeclarations.length > 0
      ? Math.ceil(filteredDeclarations.length / pageSize)
      : 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {paginatedDeclarations.length > 0 && (
        <DataTable
          data={paginatedDeclarations}
          columns={columns}
          onRowClick={(row) => router.push(`/declaration/${row.id}`)}
        />
      )}

      <DataPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      {filteredDeclarations.length === 0 && (
        <EmptyState
          title={search ? "Aucune declaration trouvee" : "Creer votre premiere declaration"}
          description={
            search
              ? `Aucun resultat pour "${search}"`
              : "Il n'y a pas encore de declaration(s) dans votre compte."
          }
        />
      )}
    </div>
  );
};

export const DeclarationLoadingView = () => {
  return (
    <LoadingState
      title="Chargement des declarations"
      description="Ceci peut prendre quelques secondes..."
    />
  );
};

export const DeclarationErrorView = () => {
  return (
    <ErrorState
      title="Erreur du chargement des declarations"
      description="Quelque chose n'a pas marche lors du chargement des declarations. Veuillez reessayer."
    />
  );
};
