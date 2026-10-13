import React from 'react';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F4F6FA] min-h-[100dvh] h-dvh print:min-h-0 print:bg-white overflow-hidden">
      {/* 
        This is a dedicated layout for the Point of Sale system.
        It intentionally does NOT include the RimalSidebar or any other dashboard elements.
        This provides a 100% full-screen, distraction-free interface for cashiers.
      */}
      <main className="h-full print:h-auto overflow-hidden print:overflow-visible p-3 sm:p-6 print:p-0">
        {children}
      </main>
    </div>
  );
}
