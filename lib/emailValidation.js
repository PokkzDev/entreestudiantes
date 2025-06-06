import prisma from '@/lib/prisma';
import { isInstitutionalEmailEnabled, isInstitutionalEmailStrictModeEnabled, isEmailDomainBypassEnabled } from '@/lib/appConfig';

/**
 * Validates if an email domain is allowed for registration
 * @param {string} email - The email address to validate
 * @returns {Promise<{isValid: boolean, domain?: string, message?: string}>}
 */
export async function validateEmailDomain(email) {
  try {
    // Extract domain from email
    const emailParts = email.toLowerCase().split('@');
    if (emailParts.length !== 2) {
      return {
        isValid: false,
        message: 'Formato de correo electrónico inválido'
      };
    }

    const domain = emailParts[1];

    // Check if email domain bypass is enabled
    let bypassEnabled = false;
    try {
      bypassEnabled = await isEmailDomainBypassEnabled();
    } catch (configError) {
      console.error('Error getting email bypass config:', configError);
      // Continue with bypass disabled (default)
    }

    if (bypassEnabled) {
      // If email domain bypass is enabled, allow all emails
      return {
        isValid: true,
        domain: domain
      };
    }

    // Check if institutional email checking is enabled with fallback
    let institutionalEmailEnabled = true; // Default to enabled
    let strictModeEnabled = true; // Default to strict mode
    
    try {
      institutionalEmailEnabled = await isInstitutionalEmailEnabled();
      strictModeEnabled = await isInstitutionalEmailStrictModeEnabled();
    } catch (configError) {
      console.error('Error getting app config, using defaults:', configError);
      // Continue with default values (strict mode enabled)
    }
    
    if (!institutionalEmailEnabled) {
      // If institutional email checking is disabled, allow all emails
      return {
        isValid: true,
        domain: domain
      };
    }

    if (!strictModeEnabled) {
      // If strict mode is disabled, allow all emails (but institutional checking is still enabled for other features)
      return {
        isValid: true,
        domain: domain
      };
    }

    // Strict mode is enabled, check if domain is in allowed list
    const allowedDomain = await prisma.allowedEmailDomain.findFirst({
      where: {
        domain: domain,
        isActive: true
      }
    });

    if (!allowedDomain) {
      return {
        isValid: false,
        domain: domain,
        message: `El dominio de correo "${domain}" no está permitido para el registro. Solo se permiten correos institucionales autorizados.`
      };
    }

    return {
      isValid: true,
      domain: domain
    };
  } catch (error) {
    console.error('Error validating email domain:', error);
    return {
      isValid: false,
      message: 'Error al validar el dominio del correo electrónico'
    };
  }
}

/**
 * Gets all active allowed email domains
 * @returns {Promise<Array<{id: string, domain: string, description?: string}>>}
 */
export async function getAllowedEmailDomains() {
  try {
    const domains = await prisma.allowedEmailDomain.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        domain: true,
        description: true
      },
      orderBy: {
        domain: 'asc'
      }
    });

    return domains;
  } catch (error) {
    console.error('Error fetching allowed email domains:', error);
    return [];
  }
}

/**
 * Check if an email is from an institutional domain
 * @param {string} email - The email address to check
 * @returns {Promise<{isInstitutional: boolean, domain?: string}>}
 */
export async function isInstitutionalEmail(email) {
  try {
    const emailParts = email.toLowerCase().split('@');
    if (emailParts.length !== 2) {
      return { isInstitutional: false };
    }

    const domain = emailParts[1];

    const allowedDomain = await prisma.allowedEmailDomain.findFirst({
      where: {
        domain: domain,
        isActive: true
      }
    });

    return {
      isInstitutional: !!allowedDomain,
      domain: domain
    };
  } catch (error) {
    console.error('Error checking if email is institutional:', error);
    return { isInstitutional: false };
  }
} 