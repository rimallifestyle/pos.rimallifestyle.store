'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#33040D] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
