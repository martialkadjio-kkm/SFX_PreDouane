import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  DeclarationErrorView,
  DeclarationLoadingView,
  DeclarationView,
} from "@/modules/declarations/ui/views/declaration-views";
import { Suspense } from "react";
import DeclarationListHeader from "@/modules/declarations/ui/components/declaration-list-headers";
import { getAllDeclarations } from "@/modules/declarations/server/actions";
import { DEFAULT_PAGE } from "@/constants";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function DeclarationsContent({ currentPage }: { currentPage: number }) {
  // Charger toutes les déclarations une seule fois
  const res = await getAllDeclarations(1, 10000);

  if (!res.success) {
    return <DeclarationErrorView />
  }
  const { data, total } = res;

  if (!data) {
    return <DeclarationErrorView />
  }

  return <DeclarationView declaration={data} total={total} currentPage={currentPage} />
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
      <DeclarationListHeader />
      <Suspense fallback={<DeclarationLoadingView />}>
        <DeclarationsContent currentPage={currentPage} />
      </Suspense>
    </>
  );
};

export default Page;