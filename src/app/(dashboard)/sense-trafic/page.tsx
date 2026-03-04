import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { SenceTraficErrorView, SenceTraficLoadingView, SenceTraficView } from "@/modules/sense-trafic/ui/views/sense-trafic-view";
import { Suspense } from "react";
import { SenseTraficListHeader } from "@/modules/sense-trafic/ui/components/sense-trafic-list-header";
import { getAllSensTrafic } from "@/modules/sense-trafic/server/actions";
import { DEFAULT_PAGE } from "@/constants";
import { HscodeErrorView } from "@/modules/hscode/ui/views/hscode-view";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function SenceTraficContent({ currentPage }: { currentPage: number }) {
  // Charger tous les clients une seule fois
  const res = await getAllSensTrafic(1, 10000);

  if (!res.success) {
    return <SenceTraficErrorView />
  }
  const { data, total } = res;

  if (!data) {
    return <SenceTraficErrorView />
  }

  return <SenceTraficView senseTrafic={data} total={total} currentPage={currentPage} />
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
      <SenseTraficListHeader />
      <Suspense fallback={<SenceTraficLoadingView />}>
        <SenceTraficContent currentPage={currentPage} />
      </Suspense>
    </>
  );
};

export default Page;