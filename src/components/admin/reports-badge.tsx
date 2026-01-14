"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { canAccessAdmin } from "@/lib/roles"

export function ReportsBadge() {
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only fetch if user is authenticated and has admin access
    if (status !== "authenticated" || !session?.user?.role || !canAccessAdmin(session.user.role)) {
      setPendingCount(null)
      return
    }

    async function fetchPendingCount() {
      try {
        const response = await fetch("/api/admin/reports/count", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setPendingCount(data.pendingCount || 0)
        } else if (response.status === 401) {
          // User not authenticated, silently fail
          setPendingCount(null)
        }
      } catch (error) {
        // Silently fail - don't log errors for badge counts
        setPendingCount(null)
      }
    }
    fetchPendingCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    return () => clearInterval(interval)
  }, [session, status])

  if (pendingCount === null || pendingCount === 0) return null

  return (
    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
      {pendingCount > 9 ? '9+' : pendingCount}
    </span>
  )
}

