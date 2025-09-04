import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import VegetableManagement from "@/components/features/products/VegetableManagement";

export default async function ProductsManagementPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <VegetableManagement />;
}
