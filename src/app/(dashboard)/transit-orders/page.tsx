import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  TransitOrdersErrorView,
  TransitOrdersLoadingView,
  TransitOrdersView,
} from "@/modules/transit-orders/ui/views/transit-orders-view";
import { Suspense } from "react";
import TransitOrdersHeader from "@/modules/transit-orders/ui/components/transit-orders-header";
import { getAllOrdersTransit } from "@/modules/transit-orders/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function TransitOrdersContent({ currentPage }: { currentPage: number }) {
  const res = await getAllOrdersTransit(1, 10000);

  if (!res.success) {
    return <TransitOrdersErrorView />
  }
  const { data, total } = res;

  if (!data) {
    return <TransitOrdersErrorView />
  }

  return <TransitOrdersView orders={data} total={total} currentPage={currentPage} />
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
      <TransitOrdersHeader />
      <Suspense fallback={<TransitOrdersLoadingView />}>
        <TransitOrdersContent currentPage={currentPage} />
      </Suspense>
    </>
  );
};

export default Page;
