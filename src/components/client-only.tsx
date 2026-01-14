"use client";

import { useEffect, useState } from "react";

/**
 * Wrapper component that only renders children on the client side
 * Prevents hydration mismatches for dynamic content
 */
export default function ClientOnly({
  children,
  fallback = null
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : <>{fallback}</>;
}
