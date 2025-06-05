import prisma from '@/lib/prisma';

// Configuration keys
export const CONFIG_KEYS = {
  INSTITUTIONAL_EMAIL_STRICT_MODE: 'institutional_email_strict_mode',
  INSTITUTIONAL_EMAIL_ENABLED: 'institutional_email_enabled',
  REGISTRATION_ENABLED: 'registration_enabled',
  MAINTENANCE_MODE: 'maintenance_mode',
  PLAN_PURCHASING_ENABLED: 'plan_purchasing_enabled',
  EMAIL_DOMAIN_BYPASS_ENABLED: 'email_domain_bypass_enabled'
};

// Default configuration values
const DEFAULT_CONFIGS = {
  [CONFIG_KEYS.INSTITUTIONAL_EMAIL_STRICT_MODE]: {
    value: 'true',
    description: 'When enabled, only emails from allowed institutional domains can register. When disabled, all emails are allowed.'
  },
  [CONFIG_KEYS.INSTITUTIONAL_EMAIL_ENABLED]: {
    value: 'true',
    description: 'Enable or disable institutional email checking entirely.'
  },
  [CONFIG_KEYS.REGISTRATION_ENABLED]: {
    value: 'true',
    description: 'Enable or disable user registration.'
  },
  [CONFIG_KEYS.MAINTENANCE_MODE]: {
    value: 'false',
    description: 'Enable maintenance mode to restrict access to the application.'
  },
  [CONFIG_KEYS.PLAN_PURCHASING_ENABLED]: {
    value: 'true',
    description: 'Enable or disable plan purchasing functionality. When disabled, users cannot purchase new plans.'
  },
  [CONFIG_KEYS.EMAIL_DOMAIN_BYPASS_ENABLED]: {
    value: 'false',
    description: 'Enable to bypass email domain validation for registration. When enabled, users can register with any email domain.'
  }
};

/**
 * Get a configuration value by key
 * @param {string} key - Configuration key
 * @returns {Promise<string|null>} Configuration value or null if not found
 */
export async function getConfig(key) {
  try {
    const config = await prisma.appConfig.findFirst({
      where: {
        key: key,
        isActive: true
      }
    });

    return config ? config.value : null;
  } catch (error) {
    console.error(`Error getting config for key "${key}":`, error);
    return null;
  }
}

/**
 * Get a boolean configuration value
 * @param {string} key - Configuration key
 * @param {boolean} defaultValue - Default value if config not found
 * @returns {Promise<boolean>} Boolean configuration value
 */
export async function getBooleanConfig(key, defaultValue = false) {
  try {
    const value = await getConfig(key);
    if (value === null) return defaultValue;
    return value.toLowerCase() === 'true';
  } catch (error) {
    console.error(`Error getting boolean config for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Set a configuration value
 * @param {string} key - Configuration key
 * @param {string} value - Configuration value
 * @param {string} description - Optional description
 * @returns {Promise<boolean>} Success status
 */
export async function setConfig(key, value, description = null) {
  try {
    await prisma.appConfig.upsert({
      where: { key },
      update: {
        value: String(value),
        description: description,
        updatedAt: new Date()
      },
      create: {
        key,
        value: String(value),
        description: description || DEFAULT_CONFIGS[key]?.description
      }
    });

    return true;
  } catch (error) {
    console.error(`Error setting config for key "${key}":`, error);
    return false;
  }
}

/**
 * Get all configurations
 * @returns {Promise<Array>} Array of all configurations
 */
export async function getAllConfigs() {
  try {
    const configs = await prisma.appConfig.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        key: 'asc'
      }
    });

    return configs;
  } catch (error) {
    console.error('Error getting all configs:', error);
    return [];
  }
}

/**
 * Initialize default configurations if they don't exist
 * @returns {Promise<boolean>} Success status
 */
export async function initializeDefaultConfigs() {
  try {
    for (const [key, config] of Object.entries(DEFAULT_CONFIGS)) {
      const existingConfig = await prisma.appConfig.findFirst({
        where: { key }
      });

      if (!existingConfig) {
        await prisma.appConfig.create({
          data: {
            key,
            value: config.value,
            description: config.description
          }
        });
        console.log(`Initialized default config: ${key}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error initializing default configs:', error);
    return false;
  }
}

/**
 * Check if institutional email strict mode is enabled
 * @returns {Promise<boolean>} True if strict mode is enabled
 */
export async function isInstitutionalEmailStrictModeEnabled() {
  return await getBooleanConfig(CONFIG_KEYS.INSTITUTIONAL_EMAIL_STRICT_MODE, true);
}

/**
 * Check if institutional email checking is enabled
 * @returns {Promise<boolean>} True if institutional email checking is enabled
 */
export async function isInstitutionalEmailEnabled() {
  return await getBooleanConfig(CONFIG_KEYS.INSTITUTIONAL_EMAIL_ENABLED, true);
}

/**
 * Toggle institutional email strict mode
 * @param {boolean} enabled - Whether to enable strict mode
 * @returns {Promise<boolean>} Success status
 */
export async function toggleInstitutionalEmailStrictMode(enabled) {
  return await setConfig(
    CONFIG_KEYS.INSTITUTIONAL_EMAIL_STRICT_MODE,
    enabled.toString(),
    'When enabled, only emails from allowed institutional domains can register. When disabled, all emails are allowed.'
  );
}

/**
 * Toggle institutional email checking
 * @param {boolean} enabled - Whether to enable institutional email checking
 * @returns {Promise<boolean>} Success status
 */
export async function toggleInstitutionalEmailEnabled(enabled) {
  return await setConfig(
    CONFIG_KEYS.INSTITUTIONAL_EMAIL_ENABLED,
    enabled.toString(),
    'Enable or disable institutional email checking entirely.'
  );
}

/**
 * Check if plan purchasing is enabled
 * @returns {Promise<boolean>} True if plan purchasing is enabled
 */
export async function isPlanPurchasingEnabled() {
  return await getBooleanConfig(CONFIG_KEYS.PLAN_PURCHASING_ENABLED, true);
}

/**
 * Toggle plan purchasing functionality
 * @param {boolean} enabled - Whether to enable plan purchasing
 * @returns {Promise<boolean>} Success status
 */
export async function togglePlanPurchasing(enabled) {
  return await setConfig(
    CONFIG_KEYS.PLAN_PURCHASING_ENABLED,
    enabled.toString(),
    'Enable or disable plan purchasing functionality. When disabled, users cannot purchase new plans.'
  );
}

/**
 * Check if email domain bypass is enabled
 * @returns {Promise<boolean>} True if email domain bypass is enabled
 */
export async function isEmailDomainBypassEnabled() {
  return await getBooleanConfig(CONFIG_KEYS.EMAIL_DOMAIN_BYPASS_ENABLED, false);
}

/**
 * Toggle email domain bypass functionality
 * @param {boolean} enabled - Whether to enable email domain bypass
 * @returns {Promise<boolean>} Success status
 */
export async function toggleEmailDomainBypass(enabled) {
  return await setConfig(
    CONFIG_KEYS.EMAIL_DOMAIN_BYPASS_ENABLED,
    enabled.toString(),
    'Enable to bypass email domain validation for registration. When enabled, users can register with any email domain.'
  );
} 