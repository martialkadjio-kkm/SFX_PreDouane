import { getDeviseById } from "@/modules/devises/server/actions";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { DeviseIdErrorView, DevisesIdView, DeviseLoadingView } from "@/modules/devises/ui/views/devises-id-view";
import { Suspense } from "react";
import { DevisesListHeader } from "@/modules/devises/ui/components/devises-list-header";
import { getAllDevises } from "@/modules/devises/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  params: Promise<{
    devisesId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { devisesId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const res = await getDeviseById(devisesId);

  if (!res.success) {
    return <DeviseIdErrorView />;
  }
  const { data } = res;

  if (!data) {
    return <DeviseIdErrorView />;
  }

  

  return (
    <>
      <Suspense fallback={<DeviseLoadingView />}>
        <DevisesIdView devises={data} devisesId={devisesId} />
      </Suspense>
    </>
  );
};

export default Page;