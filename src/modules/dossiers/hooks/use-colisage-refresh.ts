"use client";

import { useCallback, useEffect, useState } from "react";

// Store global pour gérer les événements de rafraîchissement
const refreshEvents = new Map<number, Set<() => void>>();

export const useColisageRefresh = (dossierId: number) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fonction pour déclencher le rafraîchissement
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // S'abonner aux événements de rafraîchissement pour ce dossier
  useEffect(() => {
    if (!refreshEvents.has(dossierId)) {
      refreshEvents.set(dossierId, new Set());
    }
    
    const callbacks = refreshEvents.get(dossierId)!;
    callbacks.add(triggerRefresh);

    return () => {
      callbacks.delete(triggerRefresh);
      if (callbacks.size === 0) {
        refreshEvents.delete(dossierId);
      }
    };
  }, [dossierId, triggerRefresh]);

  return { refreshTrigger };
};

// Fonction utilitaire pour déclencher le rafraîchissement depuis n'importe où
export const triggerColisageRefresh = (dossierId: number) => {
  const callbacks = refreshEvents.get(dossierId);
  if (callbacks) {
    callbacks.forEach(callback => callback());
  }
};