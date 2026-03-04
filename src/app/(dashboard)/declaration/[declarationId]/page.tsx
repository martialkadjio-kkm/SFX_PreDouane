import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { Suspense } from "react";
import { getDeclarationById } from "@/modules/declarations/server/actions";
import {
  DeclarationIdErrorView,
  DeclarationIdLoadingView,
  DeclarationIdView,
} from "@/modules/declarations/ui/views/declaration-id-view";


interface Props {
  params: Promise<{
    declarationId: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { declarationId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const res = await getDeclarationById(declarationId);
  

  if (!res.success) {
    return <DeclarationIdErrorView />;
  }
  const { data } = res;

  if (!data) {
    return <DeclarationIdErrorView />;
  }

 

  return (
    <>
      <Suspense fallback={<DeclarationIdLoadingView />}>
        <DeclarationIdView declaration={data} declarationId={declarationId}/>
      </Suspense>
    </>
  );
};

export default Page;