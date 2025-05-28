import { NextResponse } from 'next/server';
import { getAllowedEmailDomains } from '@/lib/emailValidation';

export async function GET() {
  try {
    const domains = await getAllowedEmailDomains();
    
    return NextResponse.json({
      success: true,
      domains: domains
    });
  } catch (error) {
    console.error('Error fetching allowed domains:', error);
    return NextResponse.json(
      { message: 'Error al obtener los dominios permitidos' },
      { status: 500 }
    );
  }
} 