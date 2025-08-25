import SellerVerificationDashboard from "@/components/features/admin/SellerVerificationDashboard";
import AdminGuard from "@/components/common/AdminGuard";

export default function AdminSellerVerificationPage() {
  return (
    <AdminGuard>
      <SellerVerificationDashboard />
    </AdminGuard>
  );
}
