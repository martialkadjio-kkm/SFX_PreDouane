// ============ SECURITY SCHEMA TYPES ============

export interface User {
    id: string;
    username: string;
    displayName: string | null;
    email: string | null;
    roleUser: string | null;
    createdAt: Date;
}

// ============ TRANSIT SCHEMA TYPES ============

export interface Client {
    id: string;
    nom: string;
    taxId: string | null;
    pays: string | null;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    dateCreation: Date;
}

export interface OrderTransit {
    id: string;
    clientId: string;
    orderReference: string;
    operationType: string;
    customsRegime: string | null;
    descriptionOT: string | null;
    statusOT: string;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date | null;
    lastEtapeId: string | null;
}

export interface Colisage {
    id: string;
    orderTransitId: string;
    regimeId: string | null;
    hscodeId: string | null;
    invoiceNumber: string;
    division: string | null;
    poidsNet: number | null;
    poidsBrut: number | null;
    paysOrigine: string | null;
    quantite: number | null;
    deviseFacture: string | null;
    montant: number;
}

export interface Declaration {
    id: string;
    orderTransitId: string;
    numeroDeclaration: string;
    dateDeclaration: Date;
    statut: string | null;
}

export interface Devise {
    id: string;
    code: string;
    nom: string;
    symbole: string | null;
}

export interface Etape {
    id: string;
    code: string;
    libelle: string;
    ordre: number;
}

export interface Hscode {
    id: string;
    code: string;
    libelle: string;
}

export interface Regime {
    id: string;
    code: string;
    libelle: string;
    pourcentageDC: number;
    pourcentageTR: number;
}

export interface RegimeClient {
    regimeId: string;
    clientId: string;
}

export interface RegimeColisage {
    id: string;
    colisageId: string;
    poidsNet: number | null;
    poidsBrut: number | null;
    montant: number | null;
    volume: number | null;
    quantite: number | null;
    deviseLocale: string | null;
}

export interface SuiviEtape {
    id: string;
    orderTransitId: string;
    etapeId: string;
    dateDebut: Date;
    dateFin: Date | null;
    statut: string;
}

export interface TauxEchange {
    id: string;
    deviseId: string;
    dateTaux: Date;
    valeur: number;
}

export interface UserClient {
    userId: string;
    clientId: string;
}

// ============ EXTENDED TYPES WITH RELATIONS ============

export interface UserWithRelations extends User {
    orderTransits?: OrderTransit[];
    userClients?: UserClient[];
}

export interface ClientWithRelations extends Client {
    orderTransits?: OrderTransit[];
    regimeClients?: RegimeClient[];
    userClients?: UserClient[];
}

export interface OrderTransitWithRelations extends OrderTransit {
    client?: Client;
    createdByUser?: User | null;
    colisages?: Colisage[];
    declarations?: Declaration[];
    suiviEtapes?: SuiviEtape[];
}

export interface ColisageWithRelations extends Colisage {
    orderTransit?: OrderTransit;
    regime?: Regime | null;
    hscode?: Hscode | null;
    regimeColisages?: RegimeColisage[];
}

export interface DeclarationWithRelations extends Declaration {
    orderTransit?: OrderTransit;
}

export interface DeviseWithRelations extends Devise {
    tauxEchanges?: TauxEchange[];
}

export interface EtapeWithRelations extends Etape {
    suiviEtapes?: SuiviEtape[];
}

export interface HscodeWithRelations extends Hscode {
    colisages?: Colisage[];
}

export interface RegimeWithRelations extends Regime {
    colisages?: Colisage[];
    regimeClients?: RegimeClient[];
}

export interface RegimeColisageWithRelations extends RegimeColisage {
    colisage?: Colisage;
}

export interface SuiviEtapeWithRelations extends SuiviEtape {
    orderTransit?: OrderTransit;
    etape?: Etape;
}

export interface TauxEchangeWithRelations extends TauxEchange {
    devise?: Devise;
}
