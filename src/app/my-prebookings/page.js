import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import MyPreBookings from "@/components/features/users/MyPreBookings";

export default async function MyPreBookingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <MyPreBookings />;
}
