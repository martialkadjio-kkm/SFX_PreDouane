import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { HscodeErrorView, HscodeLoadingView, HscodeView } from "@/modules/hscode/ui/views/hscode-view";
import { Suspense } from "react";
import { HscodeListHeader } from "@/modules/hscode/ui/components/hscode-list-header";
import { getAllHSCodes } from "@/modules/hscode/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function HscodeContent({ currentPage }: { currentPage: number }) {
  // Charger tous les clients une seule fois
  const res = await getAllHSCodes(1, 10000);

  if (!res.success) {
    return <HscodeErrorView />
  }
  const { data, total } = res;

  if (!data) {
    return <HscodeErrorView />
  }

  return <HscodeView hscode={data} total={total} currentPage={currentPage} />
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
      <HscodeListHeader />
      <Suspense fallback={<HscodeLoadingView />}>
        <HscodeContent currentPage={currentPage} />
      </Suspense>
    </>
  );
};

export default Page;
