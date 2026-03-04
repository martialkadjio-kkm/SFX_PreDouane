import { getPaysById } from "@/modules/pays/server/actions";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { PaysIdErrorView, PaysIdView, PaysLoadingView } from "@/modules/pays/ui/views/pays-id-view";
import { Suspense } from "react";
import { PaysListHeader } from "@/modules/pays/ui/components/pays-list-header";
import { getAllPays } from "@/modules/pays/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  params: Promise<{
    paysId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { paysId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const res = await getPaysById(paysId);

  if (!res.success) {
    return <PaysIdErrorView />;
  }
  const { data } = res;

  if (!data) {
    return <PaysIdErrorView />;
  }

  

  return (
    <>
      <Suspense fallback={<PaysLoadingView />}>
        <PaysIdView pays={data} paysId={paysId} />
      </Suspense>
    </>
  );
};

export default Page;