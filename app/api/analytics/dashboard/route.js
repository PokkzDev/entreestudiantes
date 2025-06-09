import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users to view analytics
    // You can modify this to check for admin role specifically
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '30days';

    // Calculate date ranges
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '24hours':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get overall stats
    const [
      totalPageViews,
      uniqueVisitors,
      totalSessions,
      activeSessions,
    ] = await Promise.all([
      // Total page views in timeframe
      prisma.pageHit.count({
        where: { timestamp: { gte: startDate } }
      }),
      
      // Unique visitors (by session)
      prisma.pageHit.groupBy({
        by: ['sessionId'],
        where: { timestamp: { gte: startDate } }
      }).then(groups => groups.length),
      
      // Total sessions
      prisma.userSession.count({
        where: { startTime: { gte: startDate } }
      }),
      
      // Active sessions (last 30 minutes)
      prisma.userSession.count({
        where: {
          lastActivity: {
            gte: new Date(now.getTime() - 30 * 60 * 1000)
          },
          isActive: true
        }
      }),
    ]);

    // Get top pages
    const topPages = await prisma.pageStats.findMany({
      orderBy: { totalHits: 'desc' },
      take: 10,
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

    // Get hourly traffic for the last 24 hours
    const hourlyTraffic = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour,
        COUNT(*) as hits,
        COUNT(DISTINCT sessionId) as unique_visitors
      FROM PageHit 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
      ORDER BY hour ASC
    `;

    // Get daily traffic for the timeframe
    const dailyTraffic = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as hits,
        COUNT(DISTINCT sessionId) as unique_visitors
      FROM PageHit 
      WHERE timestamp >= ${startDate}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    // Get device breakdown
    const deviceStats = await prisma.pageHit.groupBy({
      by: ['device'],
      where: { timestamp: { gte: startDate } },
      _count: { device: true }
    });

    // Get browser breakdown
    const browserStats = await prisma.pageHit.groupBy({
      by: ['browser'],
      where: { timestamp: { gte: startDate } },
      _count: { browser: true }
    });

    // Get user session stats
    const sessionStats = await prisma.userSession.aggregate({
      where: { startTime: { gte: startDate } },
      _avg: {
        pageCount: true,
        durationMinutes: true,
      },
      _max: {
        pageCount: true,
        durationMinutes: true,
      }
    });

    // Get publication views (from tracked events)
    const publicationViews = await prisma.pageHit.count({
      where: {
        timestamp: { gte: startDate },
        path: '/publicacion/[id]'
      }
    });

    // Get search activity
    const searchActivity = await prisma.pageHit.count({
      where: {
        timestamp: { gte: startDate },
        path: '/busqueda'
      }
    });

    // Get new user registrations (from page tracking)
    const registrationActivity = await prisma.pageHit.count({
      where: {
        timestamp: { gte: startDate },
        path: '/registro'
      }
    });

    // Calculate bounce rate (sessions with only 1 page view)
    const bounceSessions = await prisma.userSession.count({
      where: {
        startTime: { gte: startDate },
        pageCount: 1
      }
    });

    const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions * 100).toFixed(1) : 0;

    // Calculate average session duration
    const avgSessionDuration = sessionStats._avg.durationMinutes || 0;

    return NextResponse.json({
      success: true,
      timeframe,
      summary: {
        totalPageViews,
        uniqueVisitors,
        totalSessions,
        activeSessions,
        bounceRate: parseFloat(bounceRate),
        avgSessionDuration: Math.round(avgSessionDuration * 10) / 10,
        avgPagesPerSession: sessionStats._avg.pageCount ? Math.round(sessionStats._avg.pageCount * 10) / 10 : 0,
        publicationViews,
        searchActivity,
        registrationActivity,
      },
      topPages,
      traffic: {
        hourly: hourlyTraffic,
        daily: dailyTraffic,
      },
      demographics: {
        devices: deviceStats.reduce((acc, item) => {
          acc[item.device || 'unknown'] = item._count.device;
          return acc;
        }, {}),
        browsers: browserStats.reduce((acc, item) => {
          acc[item.browser || 'unknown'] = item._count.browser;
          return acc;
        }, {}),
      },
      insights: {
        mostActiveHour: hourlyTraffic.length > 0 ? 
          hourlyTraffic.reduce((max, current) => current.hits > max.hits ? current : max) : null,
        longestSession: sessionStats._max.durationMinutes || 0,
        maxPagesViewed: sessionStats._max.pageCount || 0,
      }
    });

  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics dashboard' },
      { status: 500 }
    );
  }
} 