import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Verify Vercel cron secret (add CRON_SECRET to your Vercel env vars)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Vercel cron job triggered: checking expired subscriptions');

    // Get base URL with robust fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Validate that baseUrl is not null or empty
    if (!baseUrl || baseUrl === 'null' || baseUrl === 'undefined') {
      console.error('Warning: baseUrl is null or invalid in cron job, using fallback');
      throw new Error('Base URL configuration is invalid');
    }

    // Call the expiration checker
    const response = await fetch(`${baseUrl}/api/admin/check-expired-subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    console.log(`✅ Cron job completed: processed ${data.processedCount}/${data.totalFound} expired subscriptions`);
    
    return NextResponse.json({
      success: true,
      source: 'vercel-cron',
      ...data
    });

  } catch (error) {
    console.error('❌ Vercel cron job failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 