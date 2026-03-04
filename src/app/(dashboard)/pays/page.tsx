import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { PaysErrorView, PaysLoadingView, PaysView } from "@/modules/pays/ui/views/pays-view";
import { Suspense } from "react";
import { PaysListHeader } from "@/modules/pays/ui/components/pays-list-header";
import { getAllPays } from "@/modules/pays/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function PaysContent({ currentPage }: { currentPage: number }) {
  // Charger tous les clients une seule fois
  const res = await getAllPays(1, 10000);

  if (!res.success) {
    return <PaysErrorView />
  }
  const { data, total } = res;

  if (!data) {
    return <PaysErrorView />
  }

  return <PaysView pays={data} total={total} currentPage={currentPage} />
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
      <PaysListHeader />
      <Suspense fallback={<PaysLoadingView />}>
        <PaysContent currentPage={currentPage} />
      </Suspense>
    </>
  );
};

export default Page;