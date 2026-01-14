import React from 'react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function LessonsLoading() {
  // Show a grid of skeleton cards (e.g., 6 placeholders)
  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-2">
            <LoadingSkeleton className="h-6 w-1/3" />
            <LoadingSkeleton className="h-4 w-2/3" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
