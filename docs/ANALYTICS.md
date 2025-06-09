# 📊 Analytics System Documentation

## Overview

The Entre Estudiantes platform now includes a comprehensive, privacy-focused analytics system that tracks page views, user sessions, and user behavior across the entire application.

## Features

### 🔍 What We Track

- **Page Views**: Every page visit with normalized paths
- **User Sessions**: Session duration, page count, and navigation patterns
- **Device & Browser Info**: Device type (mobile/desktop/tablet) and browser detection
- **Publication Interactions**: Views, favorites, shares, and contact attempts
- **Search Behavior**: Search queries and result interactions
- **User Journey**: First page, last page, and session flow

### 🛡️ Privacy & Security

- **IP Address Hashing**: All IP addresses are hashed using SHA-256 with a secret salt
- **No Personal Data**: We don't store personal information in analytics
- **Session-Based**: Tracking uses anonymous session IDs
- **GDPR Compliant**: Data can be easily purged and is anonymized

## Database Models

### PageHit
Stores individual page view events:
```sql
- id: Unique identifier
- path: Normalized page path (e.g., "/publicacion/[id]")
- method: HTTP method (usually GET)
- ipAddress: Hashed IP address
- userAgent: Browser/device information
- referer: Previous page URL
- userId: User ID if logged in
- sessionId: Anonymous session identifier
- timestamp: When the hit occurred
- country: Derived from IP (optional)
- device: mobile/desktop/tablet
- browser: chrome/firefox/safari/etc
```

### PageStats
Aggregated statistics per page:
```sql
- path: The page path
- totalHits: Total page views
- uniqueHits: Unique visitors
- lastHit: Most recent visit
- hitsToday/ThisWeek/ThisMonth: Time-based counters
```

### UserSession
Session tracking:
```sql
- sessionId: Unique session identifier
- userId: User ID if logged in
- firstPageView: Entry page
- lastPageView: Exit page
- pageCount: Number of pages viewed
- startTime: Session start
- lastActivity: Last activity timestamp
- durationMinutes: Session length
```

### DailyStats
Daily aggregated statistics:
```sql
- date: The date (YYYY-MM-DD)
- totalViews: Total page views for the day
- uniqueViews: Unique visitors for the day
- newUsers: First-time visitors
- returningUsers: Returning visitors
- topPages: JSON of most popular pages
```

## API Endpoints

### POST /api/analytics/track
Track a page view or event:
```javascript
{
  "path": "/publicacion/123",
  "method": "GET",
  "referer": "https://example.com/search",
  "sessionId": "optional-session-id"
}
```

### GET /api/analytics/dashboard
Get analytics dashboard data:
```
Query Parameters:
- timeframe: "24hours" | "7days" | "30days" | "90days"
- limit: Number of results (default: 10)
```

Returns comprehensive analytics including:
- Summary statistics
- Top pages
- Device/browser breakdown
- Traffic patterns
- User insights

## Frontend Integration

### Automatic Tracking

The system automatically tracks all page views through the `AnalyticsTracker` component in the main layout. No additional setup required for basic page tracking.

### Custom Event Tracking

Use the provided hooks for specific tracking:

```javascript
import { usePageTracking, usePublicationTracking } from '@/lib/usePageTracking';

// Basic page tracking
const { trackPageView, trackEvent } = usePageTracking();

// Publication-specific tracking
const { 
  trackPublicationView, 
  trackPublicationContact, 
  trackPublicationFavorite,
  trackPublicationShare 
} = usePublicationTracking(publicationId);

// Track custom events
trackEvent({
  eventType: 'custom_action',
  customData: 'value'
});
```

### Search Tracking

```javascript
import { useSearchTracking } from '@/lib/usePageTracking';

const { trackSearch, trackSearchResultClick } = useSearchTracking();

// Track search queries
trackSearch('laptop', { category: 'electronics' }, 25);

// Track result clicks
trackSearchResultClick('pub-123', 3); // 3rd result clicked
```

## Performance Considerations

### Efficient Design
- **Batched Requests**: Multiple tracking events are batched to reduce server load
- **Async Processing**: All tracking happens asynchronously without blocking the UI
- **Indexed Database**: Proper database indexes for fast queries
- **Aggregated Data**: Pre-calculated statistics for dashboard performance

### Resource Usage
- **Minimal Client Impact**: ~2KB additional JavaScript
- **Database Efficiency**: Optimized queries with proper indexing
- **Memory Management**: Automatic cleanup of old tracking data

## Viewing Analytics

### Dashboard Access
Visit `/analytics` to view the analytics dashboard. Currently requires authentication.

### Key Metrics Available
- **Traffic Overview**: Page views, unique visitors, sessions
- **User Behavior**: Bounce rate, session duration, pages per session
- **Popular Content**: Most visited pages and publications
- **Device Analytics**: Mobile vs desktop usage
- **Browser Statistics**: Browser preference breakdown
- **Real-time Data**: Currently active users

## Configuration

### Excluding Paths
Modify the `AnalyticsTracker` component to exclude specific paths:

```javascript
usePageTracking({
  excludePaths: [
    '/api/',
    '/admin/',
    '/_next/',
  ],
});
```

### Custom Session Handling
The system automatically manages sessions using `sessionStorage`. Sessions persist until the browser tab is closed.

## Data Retention

### Automatic Cleanup
Consider implementing automatic cleanup of old analytics data:

```sql
-- Example: Delete page hits older than 90 days
DELETE FROM PageHit WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### Export Capabilities
Analytics data can be exported through the API for external analysis or backup purposes.

## Future Enhancements

### Planned Features
- **Real-time Dashboard**: Live updates using WebSockets
- **Advanced Filtering**: Filter analytics by user segments
- **Goal Tracking**: Conversion funnel analysis
- **A/B Testing**: Built-in experiment tracking
- **Email Reports**: Automated analytics reports

### Integration Options
- **Google Analytics**: Dual tracking setup
- **External Tools**: Export to analytics platforms
- **Custom Dashboards**: API for building custom views

## Troubleshooting

### Common Issues

1. **No Data Appearing**
   - Check if tracking is enabled in the component
   - Verify database connection
   - Check browser console for errors

2. **Duplicate Tracking**
   - Ensure `AnalyticsTracker` is only included once
   - Check for multiple tracking calls

3. **Performance Issues**
   - Monitor database query performance
   - Consider increasing batch sizes
   - Check for proper indexing

### Debug Mode
Enable debug logging by setting `console.debug` calls to `console.log` in the tracking hooks.

## Security Notes

- All IP addresses are hashed and cannot be reverse-engineered
- No personally identifiable information is stored
- Session IDs are randomly generated and not linked to user accounts
- Data can be easily anonymized or deleted for GDPR compliance

## Support

For questions or issues with the analytics system, check:
1. Browser console for client-side errors
2. Server logs for API errors
3. Database logs for query issues
4. Network tab for failed requests

The analytics system is designed to fail gracefully - if tracking fails, it won't affect the user experience. 