import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import GoogleSheetsManagement from "@/components/features/sheets/GoogleSheetsManagement";

export default async function GoogleSheetsManagementPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return <GoogleSheetsManagement />;
}
