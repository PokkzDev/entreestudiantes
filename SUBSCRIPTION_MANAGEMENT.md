# Subscription Expiration Management

This document explains how subscription expiration is handled in the Entre Estudiantes platform.

## 🔍 Overview

The subscription system now includes automatic expiration handling with the following components:

1. **Exact 30-day subscriptions** (not calendar months)
2. **Automatic expiration checking** via API endpoint
3. **Scheduled execution** via cron jobs or manual scripts
4. **User downgrading** to free tier when expired

## ⏰ Plan Duration

### Fixed Duration
All plans now have **exactly 30 days** duration, not calendar months. This ensures:
- Consistent billing periods
- Predictable expiration dates
- No confusion about month lengths (28-31 days)

### Implementation
```javascript
const startDate = new Date();
const endDate = new Date();
endDate.setDate(startDate.getDate() + 30); // Exactly 30 days
```

## 🔄 Expiration Checking

### Automatic Process
The system includes an API endpoint that:
1. Finds all users with expired active subscriptions
2. Downgrades them to free tier
3. Marks subscriptions as 'expired'
4. Logs all activities for auditing

### API Endpoint
```
POST /api/admin/check-expired-subscriptions
```

**Authentication:** Requires `CRON_API_KEY` in Authorization header

**Response:**
```json
{
  "success": true,
  "processedCount": 5,
  "totalFound": 5,
  "results": [...],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🛠️ Setup Instructions

### 1. Environment Variables
Add to your `.env` file:
```env
CRON_API_KEY=your_secure_random_key_here
```

### 2. Manual Execution
Run the script manually:
```bash
# Live execution
node scripts/check-expired-subscriptions.js

# Dry run (see what would happen)
node scripts/check-expired-subscriptions.js --dry-run
```

### 3. Cron Job Setup

#### Option A: Server Cron Job
Add to your server's crontab:
```bash
# Check every hour
0 * * * * cd /path/to/your/app && node scripts/check-expired-subscriptions.js

# Check every 6 hours
0 */6 * * * cd /path/to/your/app && node scripts/check-expired-subscriptions.js

# Check daily at 2 AM
0 2 * * * cd /path/to/your/app && node scripts/check-expired-subscriptions.js
```

#### Option B: External Cron Service
Use services like:
- **Cron-job.org**
- **EasyCron**
- **Vercel Cron** (if deployed on Vercel)

Configure them to call:
```
POST https://yourdomain.com/api/admin/check-expired-subscriptions
Headers: Authorization: Bearer your_cron_api_key
```

#### Option C: Vercel Cron Functions
If using Vercel, create `api/cron/check-subscriptions.js`:
```javascript
import { NextResponse } from 'next/server';

export async function GET(request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Call the expiration checker
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/check-expired-subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

Then add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-subscriptions",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## 📊 Monitoring

### Logging
All expiration activities are logged with:
- User email and ID
- Previous tier level
- Expiration date
- Processing timestamp
- Any errors encountered

### Monitoring Recommendations
1. **Set up alerts** for script failures
2. **Monitor logs** for unusual patterns
3. **Track metrics** like:
   - Number of daily expirations
   - Error rates
   - Processing time

### Health Check
The endpoint also supports GET requests for health checks:
```bash
curl https://yourdomain.com/api/admin/check-expired-subscriptions
```

## 🔐 Security

### API Key Protection
- The endpoint requires authentication via `CRON_API_KEY`
- Use a strong, random key (minimum 32 characters)
- Rotate keys periodically
- Never commit keys to version control

### Access Control
- The endpoint is only accessible via POST
- Only processes expired subscriptions (no manual overrides)
- Uses database transactions for consistency
- Logs all activities for auditing

## 🚨 Troubleshooting

### Common Issues

1. **Script fails with connection error**
   - Check if the app is running
   - Verify the `NEXT_PUBLIC_APP_URL` is correct
   - Ensure database is accessible

2. **Unauthorized errors**
   - Verify `CRON_API_KEY` matches in both script and API
   - Check environment variables are loaded correctly

3. **No subscriptions processed**
   - Check if there are actually expired subscriptions
   - Verify date calculations are correct
   - Review database timezone settings

### Testing
```bash
# Test the API directly
curl -X POST \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  https://yourdomain.com/api/admin/check-expired-subscriptions

# Test with the script
node scripts/check-expired-subscriptions.js --dry-run
```

## 📈 Recommendations

### Frequency
- **Every 1-6 hours** for active production systems
- **Daily** for smaller applications
- **Avoid high-frequency** (every minute) to prevent resource waste

### Monitoring
- Set up email/Slack notifications for:
  - Script failures
  - Large numbers of expirations
  - Processing errors

### Backup Strategy
- Regularly backup user data before major changes
- Test the expiration process in staging environment
- Monitor the first few weeks after implementation

## 🔮 Future Enhancements

Possible improvements:
1. **Grace periods** before downgrading
2. **Email notifications** before/after expiration
3. **Automatic renewal** via saved payment methods
4. **Pro-rated refunds** for early cancellations
5. **Subscription pause/resume** functionality 