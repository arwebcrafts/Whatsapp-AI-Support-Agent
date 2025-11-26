# Admin Self-Grant Instructions

## Security Note
The `/admin/setup` page has been removed for security reasons. Use the API directly instead.

## How to Grant Yourself Admin Access

You must already have `role='admin'` in the database. Then use one of these methods:

### Method 1: Browser Console (Easiest)

1. Log in to your admin account
2. Open browser console (F12 or Right-click → Inspect → Console)
3. Paste this code and press Enter:

```javascript
fetch('/api/admin/grant-self-access', { method: 'POST' })
  .then(r => r.json())
  .then(data => {
    console.log(data.message);
    alert(data.message);
    setTimeout(() => location.reload(), 1000);
  })
  .catch(err => console.error('Error:', err));
```

4. You'll see a success message
5. Page will reload automatically
6. You now have unlimited access!

### Method 2: Using curl

```bash
curl -X POST https://your-domain.com/api/admin/grant-self-access \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"
```

### Method 3: Direct Database Update (If API doesn't work)

```sql
-- Find your user ID
SELECT id, email, role, planType FROM users WHERE email = 'your@email.com';

-- Update your account
UPDATE users
SET planType = 'admin_access',
    subscriptionStatus = 'lifetime',
    trialEndsAt = NULL
WHERE email = 'your@email.com';

-- Update message limits
UPDATE message_usage
SET messageLimit = 999999999
WHERE userId = 'your-user-id-here';
```

## Security

- ✅ Endpoint requires authentication
- ✅ Endpoint requires role='admin'
- ✅ Cannot be accessed by regular users
- ✅ No public page that could be discovered
- ✅ Must be called intentionally

## After Granting Access

You will have:
- ✅ Unlimited messages (999,999,999)
- ✅ Unlimited agents
- ✅ Unlimited connections
- ✅ No trial expiration
- ✅ Lifetime subscription
- ✅ No "Upgrade" button in sidebar
