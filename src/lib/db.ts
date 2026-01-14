// Use the same prisma instance that has the PostgreSQL adapter configured
// This ensures consistent connection handling and prevents connection pool issues
import { prisma } from "@/lib/prisma"

// Export prisma as db for backward compatibility
export const db = prisma
