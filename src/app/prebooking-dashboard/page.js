import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PreBookingDashboard from "@/components/features/sellers/PreBookingDashboard";

export default async function PreBookingDashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <PreBookingDashboard />;
}
