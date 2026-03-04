import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { EtapeErrorView, EtapeLoadingView, EtapeView } from "@/modules/etape/ui/views/etape-view";
import { Suspense } from "react";
import { EtapeListHeader } from "@/modules/etape/ui/components/etape-list-header";
import { getAllEtapes } from "@/modules/etape/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function EtapeContent({ currentPage }: { currentPage: number }) {
  // Charger toutes les étapes en une seule fois avec une limite large
  const res = await getAllEtapes(1, 10000);

  if (!res.success) {
    return <EtapeErrorView />;
  }

  const { data, total } = res;

  if (!data) {
    return <EtapeErrorView />;
  }

  return <EtapeView etapes={data} total={total} currentPage={currentPage} />;
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
      <EtapeListHeader />
      <Suspense fallback={<EtapeLoadingView />}>
        <EtapeContent currentPage={currentPage} />
      </Suspense>
    </>
  );
};

export default Page;
