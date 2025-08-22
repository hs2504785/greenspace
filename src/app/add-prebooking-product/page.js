import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AddPreBookingProduct from "@/components/features/sellers/AddPreBookingProduct";

export default async function AddPreBookingProductPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <AddPreBookingProduct />;
}
