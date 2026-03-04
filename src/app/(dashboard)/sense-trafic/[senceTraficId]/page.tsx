
import { getSensTraficById } from "@/modules/sense-trafic/server/actions";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { SenseTraficIdErrorView, SenseTraficIdLoadingView, SenseTraficIdView } from "@/modules/sense-trafic/ui/views/sense-trafic-id-view";
import { Suspense } from "react";
import { SenseTraficListHeader } from "@/modules/sense-trafic/ui/components/sense-trafic-list-header";
import { getAllSensTrafic } from "@/modules/sense-trafic/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  params: Promise<{
    senceTraficId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { senceTraficId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const res = await getSensTraficById(senceTraficId);

  if (!res.success) {
    return <SenseTraficIdErrorView />;
  }
  const { data } = res;

  if (!data) {
    return <SenseTraficIdErrorView />;
  }



  return (
    <>
      <Suspense fallback={<SenseTraficIdLoadingView />}>
        <SenseTraficIdView senseTrafic={data} senseTraficId={senceTraficId} />
      </Suspense>
    </>
  );
};

export default Page;