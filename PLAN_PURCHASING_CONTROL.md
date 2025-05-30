# Quick Guide: Plan Purchasing Control

Control plan purchasing functionality without rebuilding the app.

## 🚀 Quick Commands

```bash
# Check current status
node scripts/toggle-plan-purchasing.js status

# Disable plan purchasing (maintenance mode)
node scripts/toggle-plan-purchasing.js disable

# Enable plan purchasing (restore normal operation)
node scripts/toggle-plan-purchasing.js enable
```

## 📊 What happens when disabled?

- ✅ **Existing subscriptions continue to work**
- ❌ **New purchases are blocked**
- 🔄 **Changes take effect immediately**
- ⚠️ **Users see a warning message**

## 🔗 Other Methods

### Via API (requires admin key):
```bash
curl -X PUT "https://yourdomain.com/api/admin/config" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "toggle_plan_purchasing", "enabled": false}'
```

### Via Database:
```sql
UPDATE AppConfig SET value = 'false' WHERE key = 'plan_purchasing_enabled';
```

## 📚 Full Documentation

See [docs/PLAN_PURCHASING_CONTROL.md](docs/PLAN_PURCHASING_CONTROL.md) for complete documentation.

---

**Environment Variable Required:**
Set `ADMIN_API_KEY` or `CRON_API_KEY` for API access. 