export type RegimeDeclarationWithDouanier = {
    id: number;
    libelleRegimeDeclaration: string;
    tauxRegime: number; // Convert Decimal to number for client component
    regimeDouanier: number;
    dateCreation: Date | string;
    tRegimesDouaniers?: {
        id: number;
        libelleRegimeDouanier: string;
    } | null;
};