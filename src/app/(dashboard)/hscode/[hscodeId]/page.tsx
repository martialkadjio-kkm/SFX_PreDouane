
import { getHSCodeById } from "@/modules/hscode/server/actions";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { HscodeIdErrorView, HscodeIdView, HscodeIdLoadingView } from "@/modules/hscode/ui/views/hscode-id-view";
import { Suspense } from "react";

interface Props {
  params: Promise<{
    hscodeId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { hscodeId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const res = await getHSCodeById(hscodeId);

  if (!res.success) {
    return <HscodeIdErrorView />;
  }
  const { data } = res;

  if (!data) {
    return <HscodeIdErrorView />;
  }



  return (
    <>
      <Suspense fallback={<HscodeIdLoadingView />}>
        <HscodeIdView hscode={data} hscodeId={hscodeId} />
      </Suspense>
    </>
  );
};

export default Page;