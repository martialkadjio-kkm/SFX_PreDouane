import { getColisageById } from "@/modules/colisage/server/actions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
    ColisageIdErrorView,
    ColisageIdLoadingView,
    ColisageIdView,
} from "@/modules/colisage/ui/views/colisage-id-view";
import { Suspense } from "react";

interface Props {
    params: Promise<{
        colisageId: string;
    }>;
}

const Page = async ({ params }: Props) => {
    const { colisageId } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const res = await getColisageById(colisageId);

    if (!res.success) {
        return <ColisageIdErrorView />;
    }

    const { data } = res;

    if (!data) {
        return <ColisageIdErrorView />;
    }

    return (
        <>
            <Suspense fallback={<ColisageIdLoadingView />}>
                <ColisageIdView
                    colisage={data}
                    colisageId={colisageId}
                />
            </Suspense>
        </>
    );
};

export default Page;
