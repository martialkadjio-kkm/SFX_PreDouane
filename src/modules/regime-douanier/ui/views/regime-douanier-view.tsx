"use client";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/constants";
import { Regime } from "@/generated/prisma";
import { useRegimeDouanierSearch } from "../../hooks/use-regime-douanier-search";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import { DataPagination } from "@/components/data-pagination";
import { EmptyState } from "@/components/empty-state";
import { columns } from "../components/columns";
import { useRouter } from "next/navigation";

type Props = {
  regime: Regime[];
  total?: number;
  currentPage?: number;
};

export const RegimeDouanierView = ({ regime, total = 0, currentPage = DEFAULT_PAGE }: Props) => {

     const router = useRouter();
      const { search } = useRegimeDouanierSearch();
      const [page, setPage] = useState(currentPage || DEFAULT_PAGE);
    
      const pageSize = DEFAULT_PAGE_SIZE;
    
      // Filtrer les données localement
      const filteredRegimeDouanier = useMemo(() => {
        if (!search) return regime;
    
        const searchLower = search.toLowerCase();
        return regime.filter(c =>
          c.libelle?.toLowerCase().includes(searchLower) 
        );
      }, [regime, search]);
    
      // Paginer les données filtrées
      const paginatedRegimeDouanier = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredRegimeDouanier.slice(startIndex, endIndex);
      }, [filteredRegimeDouanier, page, pageSize]);
    
      const totalPages = filteredRegimeDouanier.length > 0 ? Math.ceil(filteredRegimeDouanier.length / pageSize) : 1;
    
      const handlePageChange = (newPage: number) => {
        setPage(newPage);
      };

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      {paginatedRegimeDouanier && paginatedRegimeDouanier.length > 0 && (
            <DataTable
              data={paginatedRegimeDouanier}
              columns={columns}
              onRowClick={(row) => router.push(`/regime-douanier/${row.id}`)}
            />
          )}
    
          <DataPagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
          {filteredRegimeDouanier?.length === 0 && (
            <EmptyState
              title={search ? "Aucun regume douanier trouvé" : "Creer votre premier regime douanier"}
              description={search ? `Aucun résultat pour "${search}"` : "Il n'y a pas encore de regime dournier dans votre compte."}
            />
          )}
    </div>
  );
};

export const RegimeDoaunierLoadingView = () => {
  return (
    <LoadingState
      title="Chargements Regimes Douaniers"
      description="Ceci peut prendre quelques secondes..."
    />
  );
};

export const RegimeDoaunierErrorView = () => {
  return (
    <ErrorState
      title="Erreur du chargements des Regimes Douaniers"
      description="Quelque chose n'a pas marcher lors du chargement des Regimes Douaniers. Veuillez reessayer."
    />
  );
};
