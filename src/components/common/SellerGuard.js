'use client';

import { useUserRole } from '@/hooks/useUserRole';
import LoadingSpinner from './LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function SellerGuard({ children }) {
  const { isSeller, isAdmin, loading } = useUserRole();
  const router = useRouter();

  const hasAccess = isSeller || isAdmin;

  useEffect(() => {
    if (!loading && !hasAccess) {
      toast.error('Access denied. Seller or Admin account required.');
      router.push('/');
    }
  }, [loading, hasAccess, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!hasAccess) {
    return null;
  }

  return children;
}
