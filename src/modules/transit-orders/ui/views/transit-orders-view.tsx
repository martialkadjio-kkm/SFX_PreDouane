"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/laoding-state";
import { columns } from "../components/columns";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { OrderTransit, Client } from "@/generated/prisma";
import { DataPagination } from "@/components/data-pagination";
import { useMemo, useState } from "react";
import { useTransitOrdersSearch } from "../../hooks/use-transit-orders-search";
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE } from "@/constants";

type OrderTransitWithClient = OrderTransit & { client?: Client | null };

type Props = {
    orders: OrderTransitWithClient[];
    total?: number;
    currentPage?: number;
};

export const TransitOrdersView = ({ orders, total = 0, currentPage = DEFAULT_PAGE }: Props) => {
    const router = useRouter();
    const { search } = useTransitOrdersSearch();
    const [page, setPage] = useState(currentPage || DEFAULT_PAGE);

    const pageSize = DEFAULT_PAGE_SIZE;

    // Filtrer les données localement
    const filteredOrders = useMemo(() => {
        if (!search) return orders;

        const searchLower = search.toLowerCase();
        return orders.filter(o =>
            o.orderReference?.toLowerCase().includes(searchLower) ||
            o.description?.toLowerCase().includes(searchLower) ||
            o.client?.nom?.toLowerCase().includes(searchLower)
        );
    }, [orders, search]);

    // Paginer les données filtrées
    const paginatedOrders = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredOrders.slice(startIndex, endIndex);
    }, [filteredOrders, page, pageSize]);

    const totalPages = filteredOrders.length > 0 ? Math.ceil(filteredOrders.length / pageSize) : 1;

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    return (
        <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
            {paginatedOrders && paginatedOrders.length > 0 && (
                <DataTable
                    data={paginatedOrders}
                    columns={columns}
                    onRowClick={(row) => router.push(`/transit-orders/${row.id}`)}
                />
            )}

            <DataPagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
            {filteredOrders?.length === 0 && (
                <EmptyState
                    title={search ? "Aucun ordre trouvé" : "Créer votre premier ordre de transit"}
                    description={search ? `Aucun résultat pour "${search}"` : "Il n'y a pas encore d'ordres de transit dans votre compte."}
                />
            )}
        </div>
    );
};

export const TransitOrdersLoadingView = () => {
    return (
        <LoadingState
            title="Chargement des ordres de transit"
            description="Ceci peut prendre quelques secondes..."
        />
    );
};

export const TransitOrdersErrorView = () => {
    return (
        <ErrorState
            title="Erreur du chargement des ordres de transit"
            description="Quelque chose n'a pas marché lors du chargement des ordres de transit. Veuillez réessayer."
        />
    );
};
