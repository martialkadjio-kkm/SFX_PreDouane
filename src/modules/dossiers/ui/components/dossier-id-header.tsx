import { ChevronRightIcon, TrashIcon, PencilIcon, MoreVerticalIcon, ScaleIcon, XCircleIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuContent
} from "@/components/ui/dropdown-menu";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface Props {
    dossierId: string;
    dossierReference: string;
    onEdit: () => void;
    onRemove: () => void;
    onUpdatePesee: () => void;
    onCancel?: () => void;
    canCancel?: boolean;
}

export const DossierIdHeader = ({
    dossierId,
    dossierReference,
    onEdit,
    onRemove,
    onUpdatePesee,
    onCancel,
    canCancel = false
}: Props) => {
    return (
        <div className="flex items-center justify-between">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-medium text-xl">
                            <Link href={'/dossiers'}>
                                Dossiers
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-foreground text-xl font-medium [&>svg]:size-4">
                        <ChevronRightIcon />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild className="font-medium text-xl text-foreground">
                            <Link href={`/dossiers/${dossierId}`}>
                                {dossierReference}
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                        <MoreVerticalIcon />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                        <PencilIcon className="size-4 text-black" />
                        Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onUpdatePesee}>
                        <ScaleIcon className="size-4 text-black" />
                        Mise à jour de la pesée
                    </DropdownMenuItem>
                    {canCancel && onCancel && (
                        <DropdownMenuItem onClick={onCancel}>
                            <XCircleIcon className="size-4 text-orange-600" />
                            Annuler le dossier
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={onRemove}>
                        <TrashIcon className="size-4 text-black" />
                        Supprimer
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
