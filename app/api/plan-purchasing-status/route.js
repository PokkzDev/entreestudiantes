import { NextResponse } from 'next/server';
import { isPlanPurchasingEnabled } from '@/lib/appConfig';

export async function GET() {
  try {
    const enabled = await isPlanPurchasingEnabled();
    
    return NextResponse.json({
      success: true,
      enabled,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking plan purchasing status:', error);
    
    // Default to enabled if there's an error
    return NextResponse.json({
      success: true,
      enabled: true,
      timestamp: new Date().toISOString()
    });
  }
} 