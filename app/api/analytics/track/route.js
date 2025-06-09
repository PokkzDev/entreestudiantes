import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper function to hash IP addresses for privacy
function hashIP(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + process.env.NEXTAUTH_SECRET).digest('hex').substring(0, 16);
}

// Helper function to extract device info from user agent
function parseUserAgent(userAgent) {
  if (!userAgent) return { device: null, browser: null };
  
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  let device = 'desktop';
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    device = 'mobile';
  } else if (/ipad|tablet|kindle|silk|playbook/i.test(ua)) {
    device = 'tablet';
  }
  
  // Detect browser
  let browser = 'other';
  if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr')) {
    browser = 'chrome';
  } else if (ua.includes('firefox')) {
    browser = 'firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'safari';
  } else if (ua.includes('edg')) {
    browser = 'edge';
  } else if (ua.includes('opr')) {
    browser = 'opera';
  }
  
  return { device, browser };
}

// Helper function to normalize paths for better tracking
function normalizePath(path) {
  if (!path) return '/';
  
  // Remove query parameters and fragments
  const cleanPath = path.split('?')[0].split('#')[0];
  
  // Normalize publication paths to group them
  if (cleanPath.startsWith('/publicacion/')) {
    return '/publicacion/[id]';
  }
  
  // Normalize profile paths
  if (cleanPath.startsWith('/perfil/')) {
    return '/perfil/[username]';
  }
  
  // Normalize edit publication paths
  if (cleanPath.startsWith('/editar-publicacion/')) {
    return '/editar-publicacion/[id]';
  }
  
  return cleanPath;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { path, method = 'GET', referer, sessionId, analyticsUserId, consentGiven } = body;
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Check if the request includes consent confirmation
    // This is an additional server-side check, though the main filtering happens client-side
    if (consentGiven === false) {
      return NextResponse.json({ 
        success: false, 
        message: 'Analytics tracking disabled by user consent' 
      }, { status: 200 });
    }

    // Get session info
    const session = await getServerSession(authOptions);
    
    // Get request metadata
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(/, /)[0] : request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");
    
    // Hash IP for privacy
    const hashedIP = hashIP(ipAddress);
    
    // Parse user agent
    const { device, browser } = parseUserAgent(userAgent);
    
    // Normalize path for consistent tracking
    const normalizedPath = normalizePath(path);
    
    // Generate or use provided session ID
    const trackingSessionId = sessionId || crypto.randomUUID();
    
    // Create page hit record (but do it efficiently)
    const pageHitPromise = prisma.pageHit.create({
      data: {
        path: normalizedPath,
        method,
        ipAddress: hashedIP,
        userAgent,
        referer,
        userId: session?.user?.id,
        sessionId: trackingSessionId,
        analyticsUserId: analyticsUserId, // Persistent anonymous user ID
        device,
        browser,
      },
    });

    // Update or create page stats (upsert for efficiency)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pageStatsPromise = prisma.pageStats.upsert({
      where: { path: normalizedPath },
      update: {
        totalHits: { increment: 1 },
        lastHit: new Date(),
        // We'll update unique hits in a background process to avoid complexity here
      },
      create: {
        path: normalizedPath,
        totalHits: 1,
        uniqueHits: 1,
        lastHit: new Date(),
        hitsToday: 1,
      },
    });

    // Update or create user session
    const sessionPromise = prisma.userSession.upsert({
      where: { sessionId: trackingSessionId },
      update: {
        lastPageView: normalizedPath,
        pageCount: { increment: 1 },
        lastActivity: new Date(),
        userId: session?.user?.id, // Update user if they logged in mid-session
        analyticsUserId: analyticsUserId, // Update analytics user ID
      },
      create: {
        sessionId: trackingSessionId,
        userId: session?.user?.id,
        analyticsUserId: analyticsUserId,
        ipAddress: hashedIP,
        userAgent,
        firstPageView: normalizedPath,
        lastPageView: normalizedPath,
        pageCount: 1,
      },
    });

    // Execute all promises in parallel for efficiency
    await Promise.all([pageHitPromise, pageStatsPromise, sessionPromise]);

    return NextResponse.json({ 
      success: true, 
      sessionId: trackingSessionId,
      message: 'Page hit tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking page hit:', error);
    return NextResponse.json(
      { error: 'Failed to track page hit' },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving analytics data
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admins to view analytics for now
    // You can modify this based on your requirements
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '7days';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '24hours':
        dateFilter = {
          timestamp: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '7days':
        dateFilter = {
          timestamp: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case '30days':
        dateFilter = {
          timestamp: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        break;
    }

    // Get top pages
    const topPages = await prisma.pageStats.findMany({
      orderBy: { totalHits: 'desc' },
      take: limit,
      select: {
        path: true,
        totalHits: true,
        uniqueHits: true,
        lastHit: true,
        hitsToday: true,
        hitsThisWeek: true,
        hitsThisMonth: true,
      }
    });

    // Get total hits for the timeframe
    const totalHits = await prisma.pageHit.count({
      where: dateFilter
    });

    // Get unique visitors for the timeframe (using analyticsUserId for better accuracy)
    const uniqueVisitors = await prisma.pageHit.groupBy({
      by: ['analyticsUserId'],
      where: {
        ...dateFilter,
        analyticsUserId: { not: null } // Only count entries with analytics user ID
      },
      _count: { analyticsUserId: true }
    });

    // Get device breakdown
    const deviceStats = await prisma.pageHit.groupBy({
      by: ['device'],
      where: dateFilter,
      _count: { device: true }
    });

    // Get browser breakdown
    const browserStats = await prisma.pageHit.groupBy({
      by: ['browser'],
      where: dateFilter,
      _count: { browser: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        totalHits,
        uniqueVisitors: uniqueVisitors.length,
        topPages,
        deviceStats: deviceStats.reduce((acc, item) => {
          acc[item.device || 'unknown'] = item._count.device;
          return acc;
        }, {}),
        browserStats: browserStats.reduce((acc, item) => {
          acc[item.browser || 'unknown'] = item._count.browser;
          return acc;
        }, {}),
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 