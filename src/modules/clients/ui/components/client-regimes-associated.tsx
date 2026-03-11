"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/laoding-state";
import { ErrorState } from "@/components/error-state";
import { getRegimesByClient } from "../../server/regime-client-actions";
import { Shield } from "lucide-react";

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

  useEffect(() => {
    const loadRegimes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await getRegimesByClient(parseInt(clientId));
        
        if (result.success) {
          setRegimes(result.data || []);
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

    loadRegimes();
  }, [clientId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Régimes associés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState
            title="Chargement des régimes..."
            description="Veuillez patienter..."
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Régimes associés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Erreur de chargement"
            description={error}
          />
        </CardContent>
      </Card>
    );
  }

  if (regimes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Régimes associés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun régime associé à ce client</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Régimes associés
          <Badge variant="secondary" className="ml-2">
            {regimes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {regimes.map((regime) => (
            <Card key={regime.id} className="border hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="text-center">
                  <h4 className="font-medium text-sm text-foreground line-clamp-2">
                    {regime.regimeLibelle}
                  </h4>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};