import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

const BOT_UA_REGEX = /(bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|preview|headless)/i;

function normalizePath(input: string): string {
  try {
    const decoded = decodeURIComponent(input).trim();
    if (!decoded) return '/';
    const onlyPath = decoded.startsWith('http') ? new URL(decoded).pathname : decoded;
    const cleaned = onlyPath.startsWith('/') ? onlyPath : `/${onlyPath}`;
    return cleaned.slice(0, 300);
  } catch {
    return '/';
  }
}

export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get('user-agent') ?? '';
    if (BOT_UA_REGEX.test(userAgent)) {
      return NextResponse.json({ ok: true, ignored: 'bot' });
    }

    const body = (await req.json().catch(() => ({}))) as { path?: string; referrer?: string };
    const path = normalizePath(body.path ?? '/');
    const referrer = body.referrer?.slice(0, 500) || null;

    const existingSid = req.cookies.get('fb_sid')?.value;
    const sessionId = existingSid || randomUUID();

    const alreadyCounted = await prisma.pageVisit.findFirst({
      where: { path, sessionId },
      select: { id: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      const counter = await tx.pageVisitCounter.upsert({
        where: { path },
        create: {
          path,
          totalViews: 1,
          uniqueVisitors: alreadyCounted ? 0 : 1,
        },
        update: {
          totalViews: { increment: 1 },
          ...(alreadyCounted ? {} : { uniqueVisitors: { increment: 1 } }),
        },
      });

      await tx.pageVisit.create({
        data: {
          path,
          sessionId,
          referrer,
          userAgent: userAgent.slice(0, 500),
        },
      });

      return counter;
    });

    const res = NextResponse.json({ ok: true, counter: result });
    if (!existingSid) {
      res.cookies.set('fb_sid', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  } catch (error) {
    console.error('[analytics/pageviews POST] failed', error);
    return NextResponse.json({ ok: false, error: 'Failed to track page view' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get('path');

    if (path) {
      const normalized = normalizePath(path);
      const counter = await prisma.pageVisitCounter.findUnique({ where: { path: normalized } });
      return NextResponse.json({
        ok: true,
        page: normalized,
        totalViews: counter?.totalViews ?? 0,
        uniqueVisitors: counter?.uniqueVisitors ?? 0,
      });
    }

    const top = await prisma.pageVisitCounter.findMany({
      orderBy: { totalViews: 'desc' },
      take: 50,
      select: {
        path: true,
        totalViews: true,
        uniqueVisitors: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, pages: top });
  } catch (error) {
    console.error('[analytics/pageviews GET] failed', error);
    return NextResponse.json({ ok: false, error: 'Failed to read page view counters' }, { status: 500 });
  }
}
