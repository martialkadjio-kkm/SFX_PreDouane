"use client";


import { BadgeCheck, BotIcon, ChevronDown, CodeSquare, Coins, StepForward, CommandIcon, FileIcon, FlagIcon, Newspaper, StarIcon, User2, VideoIcon, Package, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/role";

import { DashboardUserButton } from "./dashboard-user-button";

const menuSections = [
    {
        title: "Dossiers",
        icon: FileIcon,
        href: "/dossiers",
        isDirectLink: true
    },
    {
        title: "Conversions",
        icon: ArrowLeftRight,
        href: "/conversion",
        isDirectLink: true
    },
    {
        title: "Constantes",
        icon: BadgeCheck,
        items: [
            {
                icon: User2,
                label: "Clients",
                href: "/client"
            },
            {
                icon: CodeSquare,
                label: "HS Codes",
                href: "/hscode"
            },
            {
                icon: BadgeCheck,
                label: "Régimes Déclarations",
                href: "/regime-declaration"
            }
        ]
    }
];

export const DashboadSidebar = () => {
    const pathname = usePathname();
    const user: { id: string, role: Role } = { id: "temp-id", role: "moderateur" };
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "Constantes": true
    });

    const toggleSection = (title: string) => {
        setOpenSections(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    return (
        <Sidebar>
            <SidebarHeader className="text-sidebar-accent-foreground">
                <Link href="/" className="flex items-center gap-2 px-2 pt-2">
                    <Image src="/logo.svg" height={35} width={35} alt="logo" className="rounded-full w-[50px] h-[50px] object-center"/>
                    <p className="text-xl font-semibold">SFX Pre-Douane</p>
                </Link>
            </SidebarHeader>
            <div className="px-4 py-2">
                <Separator className="opacity-10 text-[#5D6B68]" />
            </div>
            <SidebarContent className="scrollbar-hide">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuSections.map((section) => (
                                <div key={section.title} className="mb-2">
                                    {section.isDirectLink ? (
                                        // Lien direct (Dossiers, Conversions)
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                className={cn(
                                                    "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68] from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                                                    pathname === section.href && "bg-linear-to-r/oklch border-[#5D6B68]/10"
                                                )}
                                                isActive={pathname === section.href}
                                            >
                                                <Link href={section.href!}>
                                                    <section.icon className="size-5" />
                                                    <span className="text-sm font-semibold tracking-tight">
                                                        {section.title}
                                                    </span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ) : (
                                        // Section avec sous-éléments (Constantes)
                                        <>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton
                                                    onClick={() => toggleSection(section.title)}
                                                    className="h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68] from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50"
                                                >
                                                    <section.icon className="size-5" />
                                                    <span className="text-sm font-semibold tracking-tight flex-1">
                                                        {section.title}
                                                    </span>
                                                    <ChevronDown
                                                        className={cn(
                                                            "size-4 transition-transform duration-200",
                                                            openSections[section.title] && "rotate-180"
                                                        )}
                                                    />
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>

                                            {openSections[section.title] && section.items && (
                                                <div className="ml-4 mt-1 space-y-1">
                                                    {section.items.map((item) => (
                                                        <SidebarMenuItem key={item.href}>
                                                            <SidebarMenuButton
                                                                asChild
                                                                className={cn(
                                                                    "h-9 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68] from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                                                                    pathname === item.href && "bg-linear-to-r/oklch border-[#5D6B68]/10"
                                                                )}
                                                                isActive={pathname === item.href}
                                                            >
                                                                <Link href={item.href}>
                                                                    <item.icon className="size-4" />
                                                                    <span className="text-sm font-medium tracking-tight">
                                                                        {item.label}
                                                                    </span>
                                                                </Link>
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="text-white">
                <DashboardUserButton />
            </SidebarFooter>
        </Sidebar>
    );
};