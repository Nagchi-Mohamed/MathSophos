import React from 'react';

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  );
}
