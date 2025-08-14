'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/utils/supabaseAuth';

export function useUserRole() {
  const { data: session } = useSession();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!session?.user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const supabase = createSupabaseClient();
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setRole(data?.role || null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [session]);

  return {
    role,
    loading,
    isBuyer: role === 'buyer',
    isSeller: role === 'seller',
    isAdmin: role === 'admin' || role === 'superadmin',
    isSuperAdmin: role === 'superadmin'
  };
}
