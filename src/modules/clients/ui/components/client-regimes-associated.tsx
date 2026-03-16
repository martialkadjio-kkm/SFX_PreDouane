"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/laoding-state";
import { ErrorState } from "@/components/error-state";
import { useConfirm } from "@/hooks/use-confirm";
import { getRegimesByClient, deleteRegimeClient } from "../../server/regime-client-actions";
import { Shield, Unlink, Link } from "lucide-react";
import { toast } from "sonner";
import { AssociateRegimeDialog } from "./associate-regime-dialog";

interface RegimeAssociated {
  id: number;
  regimeId: number;
  regimeLibelle: string;
  tauxRegime: number;
}

interface ClientRegimesAssociatedProps {
  clientId: string;
}

export const ClientRegimesAssociated = ({ clientId }: ClientRegimesAssociatedProps) => {
  const [regimes, setRegimes] = useState<RegimeAssociated[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssociateDialog, setShowAssociateDialog] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ id: number; nomClient: string } | null>(null);
  const [ConfirmDialog, confirm] = useConfirm(
    "Dissocier le régime",
    "Êtes-vous sûr de vouloir dissocier ce régime du client ? Cette action est irréversible."
  );

  const loadRegimes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getRegimesByClient(parseInt(clientId));
      
      if (result.success) {
        setRegimes(result.data || []);
        // Récupérer les infos du client pour le dialog (on peut les obtenir depuis les actions)
        if (result.clientInfo) {
          setClientInfo(result.clientInfo);
        }
      } else {
        setError(result.error || "Erreur lors du chargement des régimes");
      }
    } catch (err) {
      setError("Erreur lors du chargement des régimes");
      console.error("Erreur:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDissociate = async (regimeId: number, regimeLibelle: string) => {
    const confirmed = await confirm();
    if (!confirmed) return;

    try {
      const result = await deleteRegimeClient(regimeId);
      
      if (result.success) {
        toast.success(`Régime "${regimeLibelle}" dissocié avec succès`);
        // Recharger la liste des régimes
        await loadRegimes();
      } else {
        toast.error(result.error || "Erreur lors de la dissociation");
      }
    } catch (error) {
      toast.error("Erreur lors de la dissociation du régime");
      console.error("Erreur:", error);
    }
  };

  const handleAssociateSuccess = () => {
    setShowAssociateDialog(false);
    loadRegimes(); // Recharger la liste des régimes
  };

  useEffect(() => {
    loadRegimes();
    // Récupérer les infos du client si pas encore disponibles
    if (!clientInfo) {
      // On peut créer une action pour récupérer les infos du client ou les passer en props
      setClientInfo({ id: parseInt(clientId), nomClient: `Client ${clientId}` });
    }
  }, [clientId]);

  if (isLoading) {
    return (
      <>
        <AssociateRegimeDialog
          open={showAssociateDialog}
          onOpenChange={setShowAssociateDialog}
          client={clientInfo}
          onSuccess={handleAssociateSuccess}
        />
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader className="border-b border-slate-200 pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                Régimes associés
              </div>
              <Button
                onClick={() => setShowAssociateDialog(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Link className="w-4 h-4 mr-2" />
                Associer Régime
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <LoadingState
              title="Chargement des régimes..."
              description="Veuillez patienter..."
            />
          </CardContent>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AssociateRegimeDialog
          open={showAssociateDialog}
          onOpenChange={setShowAssociateDialog}
          client={clientInfo}
          onSuccess={handleAssociateSuccess}
        />
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader className="border-b border-slate-200 pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                Régimes associés
              </div>
              <Button
                onClick={() => setShowAssociateDialog(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Link className="w-4 h-4 mr-2" />
                Associer Régime
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ErrorState
              title="Erreur de chargement"
              description={error}
            />
          </CardContent>
        </Card>
      </>
    );
  }

  if (regimes.length === 0) {
    return (
      <>
        <AssociateRegimeDialog
          open={showAssociateDialog}
          onOpenChange={setShowAssociateDialog}
          client={clientInfo}
          onSuccess={handleAssociateSuccess}
        />
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader className="border-b border-slate-200 pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                Régimes associés
              </div>
              <Button
                onClick={() => setShowAssociateDialog(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Link className="w-4 h-4 mr-2" />
                Associer Régime
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-center font-medium">
                Aucun régime associé à ce client
              </p>
              <p className="text-slate-400 text-sm text-center mt-1">
                Les régimes apparaîtront ici une fois associés
              </p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <ConfirmDialog />
      <AssociateRegimeDialog
        open={showAssociateDialog}
        onOpenChange={setShowAssociateDialog}
        client={clientInfo}
        onSuccess={handleAssociateSuccess}
      />
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-200 pb-4">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              Régimes associés
            </div>
            <Button
              onClick={() => setShowAssociateDialog(true)}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Link className="w-4 h-4 mr-2" />
              Associer Régime
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {regimes.map((regime, index) => (
              <div
                key={regime.id}
                className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Numéro de rang */}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                  {index + 1}
                </div>
                
                {/* Contenu du régime */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-slate-800 text-base line-clamp-2">
                      {regime.regimeLibelle}
                    </h4>
                  </div>
                  
                  {/* Bouton de dissociation */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-full"
                    onClick={() => handleDissociate(regime.id, regime.regimeLibelle)}
                    title="Dissocier ce régime"
                  >
                    <Unlink className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Effet de survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-600/5 to-slate-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};