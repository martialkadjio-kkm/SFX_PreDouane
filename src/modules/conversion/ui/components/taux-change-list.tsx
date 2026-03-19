"use client";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tauxChangeColumns } from "./taux-change-columns";
import { TrendingUp } from "lucide-react";

type Props = {
    conversion: any;
    tauxList: any[];
};

export const TauxChangeList = ({ conversion, tauxList }: Props) => {
    const conversionId = conversion.ID_Convertion || conversion.id;
    
    return (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-200 pb-4">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Taux de change
                </CardTitle>
                <CardDescription>
                    Gérez les taux de change pour cette date de conversion
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                {tauxList && tauxList.length > 0 ? (
                    <DataTable
                        columns={tauxChangeColumns(conversionId.toString())}
                        data={tauxList}
                        searchKey="Devise"
                        searchPlaceholder="Rechercher une devise..."
                    />
                ) : (
                    <EmptyState
                        title="Aucun taux de change"
                        description="Ajoutez des taux de change pour cette conversion"
                    />
                )}
            </CardContent>
        </Card>
    );
};
