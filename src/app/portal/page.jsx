'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/context/PortalAuthContext';

export default function PortalDashboardPage() {
  const router = useRouter();
  const { jamaah, isLoading } = usePortalAuth();

  useEffect(() => {
    if (!isLoading && !jamaah) {
      router.replace('/portal/login');
    }
  }, [isLoading, jamaah, router]);

  if (isLoading || !jamaah) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-neutral-500 font-medium">
        Memuat...
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <p className="text-sm text-neutral-500 text-center">
        Beranda — segera dibangun
      </p>
    </div>
  );
}
