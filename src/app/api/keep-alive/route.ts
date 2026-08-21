import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/keep-alive
 *
 * Ping endpoint called daily by a GitHub Actions cron job to prevent
 * Supabase from pausing the project due to inactivity.
 * Protected by a secret token passed as ?secret=... query param.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Validate the secret token
  if (!secret || secret !== process.env.KEEP_ALIVE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Upsert a single "singleton" keep-alive record, incrementing its ping counter.
    // This guarantees at least one write to the database every time it's called.
    const record = await db.keepAlive.upsert({
      where: { id: 'singleton' },
      update: {
        ping: { increment: 1 },
      },
      create: {
        id: 'singleton',
        ping: 1,
      },
    });

    return NextResponse.json({
      ok: true,
      ping: record.ping,
      updatedAt: record.updatedAt,
      message: 'Database keep-alive ping successful ✓',
    });
  } catch (error) {
    console.error('[keep-alive] Database error:', error);
    return NextResponse.json(
      { ok: false, error: 'Database write failed' },
      { status: 500 }
    );
  }
}
