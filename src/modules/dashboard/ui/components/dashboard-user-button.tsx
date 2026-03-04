"use client";

import { useRouter } from "next/navigation";
import { ChevronDownIcon, LogOutIcon } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { useSession } from "@/hooks/use-session";
import { signOut as authSignOut } from "@/modules/auth/server/actions";

export const DashboardUserButton = () => {

    const isMobile = useIsMobile();
    const router = useRouter();
    const { user, isPending } = useSession();


    const onLogout = async () => {
        await authSignOut();
        router.push("/sign-in");
    }

    if (isPending || !user) return null


    if (isMobile) {
        return (
            <Drawer>
                <DrawerTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden">
                    <GeneratedAvatar seed={user.nomUtilisateur} variant="initials" className="size-9 mr-3" />
                    <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
                        <p className="text-sm truncate w-full">
                            {user.nomUtilisateur}
                        </p>
                        <p className="text-xs truncate w-full">
                            {user.codeUtilisateur}
                        </p>
                    </div>
                    <ChevronDownIcon className="size-4 shrink-0" />
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{user.nomUtilisateur}</DrawerTitle>
                        <DrawerDescription>{user.codeUtilisateur}</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                        <Button
                            variant="outline"
                            onClick={onLogout}
                        >
                            <LogOutIcon className="size-4 text-black" />
                            Se déconnecter
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
       <DropdownMenu>
            <DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden">
                <GeneratedAvatar seed={user.nomUtilisateur} variant="initials" className="size-9 mr-3" />
                <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
                    <p className="text-sm truncate w-full">
                        {user.nomUtilisateur}
                    </p>
                    <p className="text-xs truncate w-full">
                        {user.codeUtilisateur}
                    </p>
                </div>
                <ChevronDownIcon className="size-4 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-72">
                <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                        <span className="font-medium truncate">{user.nomUtilisateur}</span>
                        <span className="text-sm font-normal text-muted-foreground truncate">{user.codeUtilisateur}</span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={onLogout}
                    className="cursor-pointer flex items-center justify-between"
                >
                    Se déconnecter
                    <LogOutIcon className="size-4" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}