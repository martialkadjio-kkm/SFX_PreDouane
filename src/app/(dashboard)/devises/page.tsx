import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { DevisesErrorView, DevisesLoadingView, DevisesView } from "@/modules/devises/ui/views/devises-view";
import { Suspense } from "react";
import { DevisesListHeader } from "@/modules/devises/ui/components/devises-list-header";
import { getAllDevises } from "@/modules/devises/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function DevisesContent({ currentPage }: { currentPage: number }) {
  // Charger tous les clients une seule fois
  const res = await getAllDevises(1, 10000);

  if (!res.success) {
    return <DevisesErrorView />
  }
  const { data, total } = res;

  if (!data) {
    return <DevisesErrorView />
  }

  return <DevisesView devises={data} total={total} currentPage={currentPage} />
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
      <DevisesListHeader />
      <Suspense fallback={<DevisesLoadingView />}>
        <DevisesContent currentPage={currentPage} />
      </Suspense>
    </>
  );
};

export default Page;