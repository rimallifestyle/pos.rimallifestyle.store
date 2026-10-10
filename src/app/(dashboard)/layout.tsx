import React from 'react';
import RimalSidebar from '@/components/rimal-ui/RimalSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F4F6FA] font-sans print:bg-white print:min-h-0">
      {/* Sidebar fixed on the left */}
      <div className="print:hidden">
        <RimalSidebar />
      </div>
      
      {/* Main content area pushed to the right by sidebar width (w-[260px]) */}
      <div className="flex-1 ml-[260px] print:ml-0">
        {/* Main content area using native window scroll */}
        <main className="px-10 py-10 lg:px-14 print:px-0 print:py-0">
          {children}
        </main>
      </div>
    </div>
  );
}
