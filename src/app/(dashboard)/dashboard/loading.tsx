import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="max-w-[1600px] mx-auto pb-10 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8">
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded-xl w-full xl:w-[480px]"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 h-32 flex flex-col justify-between">
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Left Column Skeleton */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 h-80">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-gray-100 rounded w-full"></div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-100 h-96">
             <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-8 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="space-y-4 mt-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-100 h-56">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 h-16 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
              <div className="h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-gray-100 h-64">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="flex justify-center py-4">
              <div className="w-40 h-40 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
