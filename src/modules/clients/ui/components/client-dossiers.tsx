"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Calendar, Clock } from "lucide-react";

interface DossierClient {
    ID_Dossier: number;
    No_Dossier: string;
    No_OT: string;
    Libelle_Type_Dossier: string;
    Libelle_Statut_Dossier: string;
    Statut_Dossier: number;
    Libelle_Etape_Actuelle: string;
    Date_Creation: string;
    Date_Ouverture_Dossier: string;
}

interface Props {
    dossiers: DossierClient[];
}

export const ClientDossiers = ({ dossiers }: Props) => {
    const router = useRouter();
    
    // Limiter aux 5 derniers dossiers, triés par date de création décroissante
    const recentDossiers = dossiers
        .sort((a, b) => new Date(b.Date_Creation).getTime() - new Date(a.Date_Creation).getTime())
        .slice(0, 5);

    if (dossiers.length === 0) {
        return (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
                <CardHeader className="border-b border-slate-200 pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        Top 5 derniers dossiers ouverts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-center font-medium">
                            Aucun dossier associé à ce client
                        </p>
                        <p className="text-slate-400 text-sm text-center mt-1">
                            Les dossiers apparaîtront ici une fois créés
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-200 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    Top 5 derniers dossiers ouverts
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4">
                    {recentDossiers.map((dossier, index) => (
                        <div
                            key={dossier.ID_Dossier}
                            className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-xl hover:border-slate-300 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                            onClick={() => router.push(`/dossiers/${dossier.ID_Dossier}`)}
                        >
                            {/* Numéro de rang */}
                            <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                                {index + 1}
                            </div>
                            
                            {/* Header avec numéros */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-800 text-base">
                                        {dossier.No_Dossier}
                                    </span>
                                    {dossier.No_OT && (
                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                            OT: {dossier.No_OT}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Calendar className="w-3 h-3" />
                                    {dossier.Date_Creation ? 
                                        format(new Date(dossier.Date_Creation), "dd MMM", { locale: fr }) : 
                                        "-"
                                    }
                                </div>
                            </div>
                            
                            {/* Type de dossier */}
                            <div className="mb-3">
                                <span className="text-sm text-slate-600 font-medium">
                                    {dossier.Libelle_Type_Dossier}
                                </span>
                            </div>
                            
                            {/* Badges et statuts */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {dossier.Libelle_Etape_Actuelle && (
                                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                                        dossier.Libelle_Etape_Actuelle.toLowerCase().includes('completed') || 
                                        dossier.Libelle_Etape_Actuelle.toLowerCase().includes('terminé') ||
                                        dossier.Libelle_Etape_Actuelle.toLowerCase().includes('fini') ||
                                        dossier.Libelle_Etape_Actuelle.toLowerCase().includes('achevé')
                                        ? "bg-green-100 text-green-800" 
                                        : "bg-orange-100 text-orange-800"
                                    }`}>
                                        <Clock className="w-3 h-3" />
                                        {dossier.Libelle_Etape_Actuelle}
                                    </div>
                                )}
                            </div>
                            
                            {/* Effet de survol */}
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-600/5 to-slate-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};