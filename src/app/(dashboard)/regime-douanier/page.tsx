import { auth } from "@/lib/auth";
import { getAllRegimesDouaniers } from "@/modules/regime-douanier/server/actions";
import RegimeDouanierListHeader from "@/modules/regime-douanier/ui/components/regime-douanier-list-header";
import { RegimeDoaunierErrorView, RegimeDouanierView } from "@/modules/regime-douanier/ui/views/regime-douanier-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";



const RegimeDouanierContent = async ({ currentPage }: { currentPage: number }) => {
  // You can add data fetching logic here if needed in the future

  const res = await getAllRegimesDouaniers(1, 10000);

  if (!res.success) {
    return <RegimeDoaunierErrorView />
  }
  const { data, total } = res;
  if (!data) {
    return <RegimeDoaunierErrorView />
  }

  return <RegimeDouanierView regime={data} total={total} currentPage={currentPage} />;
}

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <>
      <RegimeDouanierListHeader />
      <RegimeDouanierContent currentPage={1} />
    </>
  );
};

export default Page;
