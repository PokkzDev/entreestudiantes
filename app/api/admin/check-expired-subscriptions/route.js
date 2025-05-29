import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Optional: Add API key authentication for security
    const authHeader = request.headers.get('authorization');
    const expectedApiKey = process.env.CRON_API_KEY;
    
    if (expectedApiKey && authHeader !== `Bearer ${expectedApiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Checking for expired subscriptions...');
    const now = new Date();

    // Find all users with expired subscriptions
    const expiredUsers = await prisma.user.findMany({
      where: {
        AND: [
          { accountTier: { not: 'free' } }, // Not already free
          { subscriptionStatus: 'active' }, // Currently active
          { tierEndDate: { lte: now } } // End date has passed
        ]
      },
      select: {
        id: true,
        email: true,
        accountTier: true,
        tierEndDate: true,
        subscriptions: {
          where: { status: 'active' },
          select: { id: true }
        }
      }
    });

    console.log(`Found ${expiredUsers.length} expired subscriptions`);

    let processedCount = 0;
    const results = [];

    for (const user of expiredUsers) {
      try {
        // Use transaction to ensure consistency
        await prisma.$transaction(async (tx) => {
          // Update user to free tier
          await tx.user.update({
            where: { id: user.id },
            data: {
              accountTier: 'free',
              subscriptionStatus: 'expired',
              updatedAt: new Date()
            }
          });

          // Mark active subscriptions as expired
          await tx.subscription.updateMany({
            where: {
              userId: user.id,
              status: 'active'
            },
            data: {
              status: 'expired',
              updatedAt: new Date()
            }
          });
        });

        processedCount++;
        results.push({
          userId: user.id,
          email: user.email,
          previousTier: user.accountTier,
          expiredDate: user.tierEndDate,
          status: 'processed'
        });

        console.log(`✅ Downgraded user ${user.email} from ${user.accountTier} to free (expired: ${user.tierEndDate})`);

      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
        results.push({
          userId: user.id,
          email: user.email,
          previousTier: user.accountTier,
          expiredDate: user.tierEndDate,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`✅ Processed ${processedCount}/${expiredUsers.length} expired subscriptions`);

    return NextResponse.json({
      success: true,
      processedCount,
      totalFound: expiredUsers.length,
      results,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error checking expired subscriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'Subscription expiration checker endpoint active',
    timestamp: new Date().toISOString()
  });
} 