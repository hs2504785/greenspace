import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

/**
 * Hook to get current admin/superadmin user ID
 * Works for any authenticated admin or falls back to any admin user
 * Returns null while loading, user ID when found
 */
export const useCurrentUser = () => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/auth/current-user");

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.id) {
            console.log(
              `Using ${data.user.source} user:`,
              data.user.email,
              `(${data.user.role})`
            );
            setUserId(data.user.id);
            setError(null);
            return;
          }
        }

        // If API fails, show error
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Unknown error";
        console.error("Failed to get current user:", errorMessage);
        setError(errorMessage);
        toast.error(
          "Unable to load user data. Please ensure you have admin access."
        );
      } catch (err) {
        console.error("Error getting user ID:", err);
        setError(err.message);
        toast.error("Failed to load user data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  return { userId, loading, error };
};
