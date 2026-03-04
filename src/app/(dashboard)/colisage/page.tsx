import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
    ColisageErrorView,
    ColisageLoadingView,
    ColisageView,
} from "@/modules/colisage/ui/views/colisage-view";
import { Suspense } from "react";
import { ColisageListHeader } from "@/modules/colisage/ui/components/colisage-list-header";
import { getAllColisages } from "@/modules/colisage/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function ColisageContent({ currentPage }: { currentPage: number }) {
    // Charger tous les colisages une seule fois
    const res = await getAllColisages(1, 10000);

    if (!res.success) {
        return <ColisageErrorView />;
    }

    const { data, total } = res;

    if (!data || total === undefined) {
        return <ColisageErrorView />;
    }

    return (
        <ColisageView
            colisages={data}
            total={total}
            currentPage={currentPage}
        />
    );
}

const Page = async ({ searchParams }: Props) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const params = await searchParams;
    const currentPage = parseInt(params.page as string) || DEFAULT_PAGE;

    return (
        <>
            <ColisageListHeader />
            <Suspense fallback={<ColisageLoadingView />}>
                <ColisageContent currentPage={currentPage} />
            </Suspense>
        </>
    );
};

export default Page;
