import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Suspense } from "react";
import { getOrderTransitById } from "@/modules/transit-orders/server/actions";
import {
    TransitOrderIdErrorView,
    TransitOrderIdLoadingView,
    TransitOrderIdView,
} from "@/modules/transit-orders/ui/views/transit-order-id-view";

interface Props {
    params: Promise<{
        orderId: string;
    }>;
}

const Page = async ({ params }: Props) => {
    const { orderId } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const res = await getOrderTransitById(orderId);

    if (!res.success) {
        return <TransitOrderIdErrorView />;
    }
    const { data } = res;

    if (!data) {
        return <TransitOrderIdErrorView />;
    }

    return (
        <>
            <Suspense fallback={<TransitOrderIdLoadingView />}>
                <TransitOrderIdView order={data} orderId={orderId} />
            </Suspense>
        </>
    );
};

export default Page;
