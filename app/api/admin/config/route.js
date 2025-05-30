import { NextResponse } from 'next/server';
import { 
  getAllConfigs, 
  setConfig, 
  getBooleanConfig,
  togglePlanPurchasing,
  toggleInstitutionalEmailEnabled,
  toggleInstitutionalEmailStrictMode,
  CONFIG_KEYS 
} from '@/lib/appConfig';

/**
 * Verify admin API key
 */
function verifyAdminAuth(request) {
  const authHeader = request.headers.get('authorization');
  const expectedApiKey = process.env.ADMIN_API_KEY || process.env.CRON_API_KEY;
  
  if (!expectedApiKey || authHeader !== `Bearer ${expectedApiKey}`) {
    return false;
  }
  return true;
}

/**
 * GET all configurations
 */
export async function GET(request) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const configs = await getAllConfigs();
    
    return NextResponse.json({
      success: true,
      configs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching configurations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST to update configurations
 */
export async function POST(request) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Validate key is one of the allowed config keys
    const validKeys = Object.values(CONFIG_KEYS);
    if (!validKeys.includes(key)) {
      return NextResponse.json(
        { success: false, error: `Invalid configuration key. Allowed keys: ${validKeys.join(', ')}` },
        { status: 400 }
      );
    }

    const success = await setConfig(key, value, description);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    console.log(`✅ Admin updated config: ${key} = ${value}`);

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      key,
      value,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT to toggle specific boolean configurations
 */
export async function PUT(request) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, enabled } = body;

    if (!action || enabled === undefined) {
      return NextResponse.json(
        { success: false, error: 'Action and enabled status are required' },
        { status: 400 }
      );
    }

    let success = false;
    let message = '';

    switch (action) {
      case 'toggle_plan_purchasing':
        success = await togglePlanPurchasing(enabled);
        message = `Plan purchasing ${enabled ? 'enabled' : 'disabled'}`;
        break;
      case 'toggle_institutional_email':
        success = await toggleInstitutionalEmailEnabled(enabled);
        message = `Institutional email checking ${enabled ? 'enabled' : 'disabled'}`;
        break;
      case 'toggle_institutional_strict_mode':
        success = await toggleInstitutionalEmailStrictMode(enabled);
        message = `Institutional email strict mode ${enabled ? 'enabled' : 'disabled'}`;
        break;
      case 'toggle_maintenance_mode':
        success = await setConfig(CONFIG_KEYS.MAINTENANCE_MODE, enabled.toString());
        message = `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`;
        break;
      case 'toggle_registration':
        success = await setConfig(CONFIG_KEYS.REGISTRATION_ENABLED, enabled.toString());
        message = `User registration ${enabled ? 'enabled' : 'disabled'}`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to toggle configuration' },
        { status: 500 }
      );
    }

    console.log(`✅ Admin toggled: ${message}`);

    return NextResponse.json({
      success: true,
      message,
      action,
      enabled,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error toggling configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 