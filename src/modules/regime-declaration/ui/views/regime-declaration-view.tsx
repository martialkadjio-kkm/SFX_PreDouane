"use client";

import { DataTable } from "@/components/data-table";
import { columns } from "../components/columns";
import { useRouter } from "next/navigation";
import { RegimeDeclarationWithDouanier } from "../../types";

interface RegimeDeclarationViewProps {
    regimeDeclarations: RegimeDeclarationWithDouanier[];
    total: number;
    currentPage: number;
}

export const RegimeDeclarationView = ({
    regimeDeclarations,
    total,
    currentPage,
}: RegimeDeclarationViewProps) => {
    const router = useRouter();

    return (
        <div className="py-4 px-4 md:px-8 flex flex-col gap-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Régimes de Déclaration</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gérez les régimes de déclaration et leurs taux associés
                    </p>
                </div>
                {regimeDeclarations.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                        {regimeDeclarations.length} régime{regimeDeclarations.length > 1 ? 's' : ''} de déclaration
                    </div>
                )}
            </div>

            <div className="rounded-lg border bg-card">
                <DataTable 
                    columns={columns} 
                    data={regimeDeclarations} 
                    onRowClick={(row) => router.push(`/regime-declaration/${row.id}`)}
                />
            </div>
        </div>
    );
};

export const RegimeDeclarationLoadingView = () => {
    return (
        <div className="py-4 px-4 md:px-8">
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-64 bg-gray-200 rounded" />
            </div>
        </div>
    );
};

export const RegimeDeclarationErrorView = () => {
    return (
        <div className="py-4 px-4 md:px-8">
            <div className="text-center py-8">
                <p className="text-red-600">Erreur lors du chargement des rÃ©gimes de dÃ©claration</p>
            </div>
        </div>
    );
};
