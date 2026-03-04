"use client";

import { useEffect, useState } from "react";
import { getColisagesByOrderTransitId, deleteColisage } from "../../server/actions";
import { LoadingState } from "@/components/laoding-state";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";
import { DataPagination } from "@/components/data-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { ColumnDef } from "@tanstack/react-table";
import { ColisageBulkActionsForOrder } from "./colisage-bulk-actions-for-order";

interface ColisageListForOrderProps {
    orderTransitId: string;
}

export const ColisageListForOrder = ({ orderTransitId }: ColisageListForOrderProps) => {
    const [colisages, setColisages] = useState<any[]>([]);
    const [filteredColisages, setFilteredColisages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const router = useRouter();
    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Êtes-vous sûr?",
        "Voulez-vous vraiment supprimer ce colisage ? Cette action est irréversible."
    );

    useEffect(() => {
        loadColisages();
    }, [orderTransitId]);

    useEffect(() => {
        filterColisages();
    }, [search, colisages]);

    const loadColisages = async () => {
        setIsLoading(true);
        try {
            const result = await getColisagesByOrderTransitId(orderTransitId);
            if (result.success && result.data) {
                setColisages(result.data);
            }
        } catch (error) {
            console.error("Error loading colisages:", error);
            toast.error("Erreur lors du chargement des colisages");
        } finally {
            setIsLoading(false);
        }
    };

    const filterColisages = () => {
        if (!search) {
            setFilteredColisages(colisages);
            return;
        }

        const searchLower = search.toLowerCase();
        const filtered = colisages.filter((col) =>
            col.description?.toLowerCase().includes(searchLower) ||
            col.nomFournisseur?.toLowerCase().includes(searchLower) ||
            col.numeroCommande?.toLowerCase().includes(searchLower) ||
            col.rowKey?.toLowerCase().includes(searchLower)
        );
        setFilteredColisages(filtered);
        setPage(1);
    };

    const handleDelete = async (id: string) => {
        const ok = await confirmRemove();
        if (!ok) return;

        try {
            const result = await deleteColisage(id);
            if (result.success) {
                toast.success("Colisage supprimé avec succès");
                loadColisages();
                router.refresh();
            } else {
                toast.error("Erreur lors de la suppression");
            }
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const paginatedData = filteredColisages.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    const columns: ColumnDef<any>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <input
                    type="checkbox"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={(e) => {
                        table.toggleAllPageRowsSelected(!!e.target.checked);
                        if (e.target.checked) {
                            setSelectedIds(paginatedData.map((row) => row.id));
                        } else {
                            setSelectedIds([]);
                        }
                    }}
                    className="cursor-pointer"
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(row.original.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedIds([...selectedIds, row.original.id]);
                        } else {
                            setSelectedIds(selectedIds.filter((id) => id !== row.original.id));
                        }
                    }}
                    className="cursor-pointer"
                />
            ),
        },
        {
            accessorKey: "rowKey",
            header: "Row Key",
            cell: ({ row }) => {
                const rowKey = row.getValue("rowKey") as string;
                return rowKey ? (
                    <Badge variant="outline" className="font-mono text-xs">{rowKey}</Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => {
                const description = row.getValue("description") as string;
                return (
                    <div className="max-w-xs truncate" title={description}>
                        {description}
                    </div>
                );
            },
        },
        {
            accessorKey: "nomFournisseur",
            header: "Fournisseur",
            cell: ({ row }) => {
                const nom = row.getValue("nomFournisseur") as string;
                return nom || "-";
            },
        },
        {
            accessorKey: "quantite",
            header: "Quantité",
            cell: ({ row }) => {
                const qte = row.getValue("quantite") as number;
                return qte || "-";
            },
        },
        {
            accessorKey: "prixUnitaireColis",
            header: "Prix Unit.",
            cell: ({ row }) => {
                const prix = row.getValue("prixUnitaireColis") as number;
                return prix || "-";
            },
        },
        {
            accessorKey: "poidsBrut",
            header: "Poids Brut",
            cell: ({ row }) => {
                const poids = row.getValue("poidsBrut") as number;
                return poids ? `${poids} kg` : "-";
            },
        },
        {
            accessorKey: "poidsNet",
            header: "Poids Net",
            cell: ({ row }) => {
                const poids = row.getValue("poidsNet") as number;
                return poids ? `${poids} kg` : "-";
            },
        },
        {
            accessorKey: "volume",
            header: "Volume",
            cell: ({ row }) => {
                const vol = row.getValue("volume") as number;
                return vol ? `${vol} m³` : "-";
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const colisage = row.original;
                return (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/colisage/${colisage.id}`)}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    if (isLoading) {
        return (
            <div className="py-8">
                <LoadingState 
                    title="Chargement des colisages..." 
                    description="Veuillez patienter..."
                />
            </div>
        );
    }

    if (colisages.length === 0) {
        return (
            <EmptyState
                title="Aucun colisage"
                description="Importez un fichier Excel pour ajouter des colisages à cet ordre de transit"
            />
        );
    }

    const totalPages = Math.ceil(filteredColisages.length / pageSize);

    return (
        <>
            <RemoveConfirmation />
            <div className="space-y-4">
                {/* Barre de recherche */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par description, fournisseur, commande..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {filteredColisages.length} colisage(s)
                    </div>
                </div>

                {/* Actions en masse */}
                {selectedIds.length > 0 && (
                    <ColisageBulkActionsForOrder
                        selectedIds={selectedIds}
                        orderTransitId={orderTransitId}
                        onSelectionChange={setSelectedIds}
                        onActionComplete={loadColisages}
                        totalCount={filteredColisages.length}
                    />
                )}

                {/* Tableau */}
                <DataTable columns={columns} data={paginatedData} />

                {/* Pagination */}
                {totalPages > 1 && (
                    <DataPagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                )}
            </div>
        </>
    );
};
