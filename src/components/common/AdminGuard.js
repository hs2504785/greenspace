'use client';

import { useUserRole } from '@/hooks/useUserRole';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminGuard({ children }) {
  const { isAdmin, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return null;
  }

  return children;
}
