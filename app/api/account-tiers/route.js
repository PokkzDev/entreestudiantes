import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tiers = await prisma.accountTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    // Transform database records to the expected format
    const formattedTiers = tiers.map(tier => ({
      tierKey: tier.tierKey,
      name: tier.name,
      publicationLimit: tier.publicationLimit,
      price: tier.price,
      features: JSON.parse(tier.features),
      icon: tier.icon,
      color: tier.color,
      bgColor: tier.bgColor,
      sortOrder: tier.sortOrder
    }));

    return NextResponse.json({
      success: true,
      tiers: formattedTiers
    });
  } catch (error) {
    console.error('Error fetching account tiers:', error);
    
    // Return error instead of fallback data
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch account tiers from database',
      tiers: []
    }, { status: 500 });
  }
} 