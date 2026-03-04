import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Suspense } from "react";
import { getRegimeDouanierById } from "@/modules/regime-douanier/server/actions";
import { RegimeIdErrorView, RegimeIdLoadingView, RegimeIdView } from "@/modules/regime-douanier/ui/views/regime-id-view";

interface Props {
    params: Promise<{
        regimeId: string;
    }>;
}

const Page = async ({ params }: Props) => {
    const { regimeId } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const res = await getRegimeDouanierById(regimeId);

    if (!res.success) {
        return <RegimeIdErrorView />;
    }
    const { data } = res;

    if (!data) {
        return <RegimeIdErrorView />;
    }

    return (
        <>
            <Suspense fallback={<RegimeIdLoadingView />}>
                <RegimeIdView regime={data} regimeId={regimeId} />
            </Suspense>
        </>
    );
};

export default Page;
