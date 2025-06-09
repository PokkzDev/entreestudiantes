import { NextResponse } from 'next/server';
import { getAllowedEmailDomains } from '@/lib/emailValidation';
import { isEmailDomainBypassEnabled, isInstitutionalEmailStrictModeEnabled } from '@/lib/appConfig';

export async function GET() {
  try {
    const domains = await getAllowedEmailDomains();
    
    // Check if external domains are allowed
    const bypassEnabled = await isEmailDomainBypassEnabled();
    const strictModeDisabled = !(await isInstitutionalEmailStrictModeEnabled());
    const externalDomainsAllowed = bypassEnabled || strictModeDisabled;
    
    return NextResponse.json({
      success: true,
      domains: domains,
      externalDomainsAllowed: externalDomainsAllowed
    });
  } catch (error) {
    console.error('Error fetching allowed domains:', error);
    return NextResponse.json(
      { message: 'Error al obtener los dominios permitidos' },
      { status: 500 }
    );
  }
} 