import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Enable SSL for all non-local connections (required for Supabase/Neon/etc)
const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const needsSsl = !isLocal || /sslmode=require|ssl=true|sslmode=verify-full/i.test(connectionString);
const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: process.env.NODE_ENV === 'production' ? 10 : 5, // Reduced for serverless
  min: 2, // Keep minimum connections alive
  idleTimeoutMillis: 60000, // 1 minute - increased for better reuse
  connectionTimeoutMillis: 10000, // 10 seconds - reduced
  statement_timeout: 30000, // 30 seconds - reduced
  query_timeout: 30000, // 30 seconds - reduced
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Always create a fresh client in development to pick up schema changes
// In production, use cached client for performance
const shouldUseCache = process.env.NODE_ENV === 'production';

export const prisma = shouldUseCache
  ? (globalForPrisma.prisma ||
    (globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: ['error'],
    })))
  : new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

// Force reload Prisma client in development to pick up new models
if (process.env.NODE_ENV !== 'production') {
  // Clear any cached Prisma client
  if (globalForPrisma.prisma) {
    globalForPrisma.prisma = undefined;
  }
}

// Only cache in production
if (shouldUseCache) {
  globalForPrisma.prisma = prisma;
}
