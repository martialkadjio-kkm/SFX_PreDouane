"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientsListTab } from "../components/clients-list-tab";

interface ClientsWithRegimesViewProps {
    currentPage: number;
}

export const ClientsWithRegimesView = ({ currentPage }: ClientsWithRegimesViewProps) => {
    return (
        <div className="flex flex-col gap-y-4">
            <div className="px-4 md:px-8 py-4">
                <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
                <p className="text-muted-foreground">
                    Gérez les clients et leurs régimes de déclaration
                </p>
            </div>

            <div className="px-4 md:px-8">
                <ClientsListTab />
            </div>
        </div>
    );
};