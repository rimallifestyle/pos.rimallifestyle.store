import React from 'react';
import RimalSidebar from '@/components/rimal-ui/RimalSidebar';
import RimalMobileNav from '@/components/rimal-ui/RimalMobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F4F6FA] font-sans print:bg-white print:min-h-0 overflow-x-hidden">
      {/* Sidebar fixed on the left */}
      <div className="print:hidden">
        <RimalSidebar />
      </div>
      
      {/* Main content area pushed to the right by sidebar width on desktop */}
      <div className="flex-1 lg:ml-[270px] print:ml-0 w-full transition-all duration-300 pb-20 lg:pb-0">
        {/* Main content area using native window scroll */}
        <main className="px-5 py-6 lg:px-10 lg:py-10 print:px-0 print:py-0 w-full max-w-[100vw]">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="print:hidden">
        <RimalMobileNav />
      </div>
    </div>
  );
}
