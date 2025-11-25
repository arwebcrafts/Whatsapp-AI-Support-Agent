# 📧 Email Configuration Guide

Complete guide to setting up email functionality in WhaSales AI.

---

## ✅ Email Features Implemented

Your application now has complete email functionality:

### **For Regular Users:**
- ✅ **Email Verification** (one-time on signup)
- ✅ Welcome email after verification
- ✅ Trial reminder emails
- ✅ Payment success notifications
- ✅ Subscription updates

### **For Admin Users:**
- ✅ **Enhanced Security**: Verification code on EVERY login
- ✅ One-time 6-digit codes
- ✅ 10-minute expiration
- ✅ 3 attempts max
- ✅ Email-based 2FA

---

## 🔧 Required Environment Variables

Add these to your Railway/production environment:

```env
# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Application URL (for email links)
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
```

---

## 📝 SMTP Provider Setup Guides

### **Option 1: Gmail (Recommended for Testing)**

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

3. **Add to Environment Variables**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

**Gmail Limits:**
- ✅ Free
- ✅ 500 emails/day
- ✅ Perfect for testing and small deployments

---

### **Option 2: SendGrid (Recommended for Production)**

1. **Create Account**
   - Go to https://sendgrid.com
   - Sign up for free account
   - Free tier: 100 emails/day

2. **Create API Key**
   - Settings → API Keys → Create API Key
   - Full Access → Create & Copy

3. **Add to Environment Variables**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASSWORD=your-sendgrid-api-key
   ```

**SendGrid Limits:**
- ✅ 100 emails/day (free)
- ✅ 40,000 emails/month (paid: $15/mo)
- ✅ Better deliverability
- ✅ Analytics dashboard

---

### **Option 3: Amazon SES (Best for Scale)**

1. **Create AWS Account**
   - Go to https://aws.amazon.com/ses
   - Sign up and verify your domain

2. **Get SMTP Credentials**
   - SES Console → SMTP Settings
   - Create SMTP Credentials
   - Download credentials

3. **Add to Environment Variables**
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-smtp-username
   SMTP_PASSWORD=your-smtp-password
   ```

**Amazon SES Limits:**
- ✅ $0.10 per 1,000 emails
- ✅ 62,000 emails/month free (first year)
- ✅ Enterprise-grade
- ✅ Best for 1000+ users

---

### **Option 4: Resend (Modern, Developer-Friendly)**

1. **Create Account**
   - Go to https://resend.com
   - Sign up with GitHub
   - Free tier: 3,000 emails/month

2. **Get API Key**
   - API Keys → Create
   - Copy the key

3. **Add to Environment Variables**
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=resend
   SMTP_PASSWORD=your-resend-api-key
   ```

**Resend Features:**
- ✅ 3,000 emails/month (free)
- ✅ 50,000 emails/month (paid: $20/mo)
- ✅ React email templates
- ✅ Great for developers

---

## 🔒 Admin Login Flow (New Feature!)

### How It Works:

1. **Admin enters email and password**
   - System validates credentials
   - Generates 6-digit code
   - Sends code to admin's email

2. **Admin checks email**
   - Receives verification code (e.g., `742891`)
   - Code expires in 10 minutes
   - 3 attempts allowed

3. **Admin enters code**
   - Code verified
   - Access granted
   - Session created

### Security Benefits:

- ✅ **Two-Factor Authentication** for admins
- ✅ Protects against stolen passwords
- ✅ Audit trail of admin logins
- ✅ Time-limited codes
- ✅ Email alerts on login attempts

### For Regular Users:

- ✅ Email verification **only once** on signup
- ✅ No codes required on login
- ✅ Better user experience

---

## 📬 Email Templates Included

All emails are professionally designed with:

### 1. **Verification Email** (Signup)
- Welcome message
- Verification link
- Brand colors (purple gradient)
- Quick start guide

### 2. **Welcome Email** (After Verification)
- Congratulations message
- Trial details (3 days, 2000 messages)
- Quick start checklist
- Dashboard link

### 3. **Admin Verification Code** (Every Admin Login)
- 6-digit code (large, bold)
- Security notice
- Expiration warning
- Login timestamp

### 4. **Trial Reminder** (2 days before expiry)
- Days remaining alert
- Upgrade benefits
- Pricing link
- Urgency message

### 5. **Payment Success**
- Thank you message
- Payment details
- Next billing date
- Dashboard access

---

## ⚙️ Railway Configuration

### Add SMTP Variables:

In Railway dashboard:

```env
# SMTP Setup (Choose one provider from above)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# App URL (use your Railway URL)
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

**Note:** Railway auto-provides `RAILWAY_PUBLIC_DOMAIN`, but you may need to manually set `NEXT_PUBLIC_APP_URL`

---

## 🧪 Testing Email Functionality

### Test Signup Flow:

1. Sign up with real email
2. Check inbox for verification email
3. Click verification link
4. Should receive welcome email
5. Check database: `emailVerified` should be `true`

### Test Admin Login:

1. Create admin user (or use `/api/admin/create-admin`)
2. Try to login with admin credentials
3. Check email for 6-digit code
4. Enter code within 10 minutes
5. Should grant access

### Check Logs:

Look for these messages:

```
✅ Email sent successfully to: user@example.com
🔐 Admin verification code generated for admin@example.com (expires in 10 min)
```

---

## 🐛 Troubleshooting

### "SMTP credentials not configured"

**Problem:** Email service sees warning but doesn't send

**Solution:**
```env
# Make sure these are set:
SMTP_USER=your-actual-email
SMTP_PASSWORD=your-actual-password
```

### "Email not received"

**Causes:**
1. Check spam folder
2. Verify SMTP credentials
3. Check email provider limits (Gmail: 500/day)
4. Verify sender email is correct

**Debug:**
```bash
# Check Railway logs for:
✅ Email sent successfully
# Or:
❌ Error sending email: [details]
```

### "Admin verification code not working"

**Causes:**
1. Code expired (10 minutes)
2. Too many attempts (3 max)
3. Typo in code

**Solution:**
- Login again to get new code
- Copy/paste code carefully
- Check email timestamp

---

## 📊 Email Sending Limits

### By Provider:

| Provider | Free Tier | Cost | Best For |
|----------|-----------|------|----------|
| Gmail | 500/day | Free | Testing |
| SendGrid | 100/day | $15/mo for 40K | Small apps |
| Amazon SES | 62K/month | $0.10/1000 | Enterprise |
| Resend | 3,000/month | $20/mo for 50K | Developers |

### For 1000 Users:

Estimated email volume/month:
- Signups: ~1,000 (verification + welcome)
- Admin logins: ~100-300 (if 10 admins)
- Trial reminders: ~500
- Payments: ~200-500
- **Total: ~2,000-3,000 emails/month**

**Recommendation:** Resend (free tier) or SendGrid ($15/mo)

---

## ✅ Environment Variables Summary

### Required for Email:

```env
SMTP_HOST=smtp.gmail.com          # Your SMTP server
SMTP_PORT=587                     # Usually 587 or 465
SMTP_SECURE=false                 # false for 587, true for 465
SMTP_USER=your-email@gmail.com    # Your email/username
SMTP_PASSWORD=your-app-password   # App-specific password
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Your app URL
```

### Optional:

```env
# If not set, emails won't send (but app still works)
# Useful for development without email setup
```

---

## 🎯 Quick Start Checklist

- [ ] Choose SMTP provider (Gmail for testing, SendGrid/Resend for production)
- [ ] Get SMTP credentials
- [ ] Add to Railway environment variables
- [ ] Test signup flow (regular user)
- [ ] Test admin login flow
- [ ] Check spam folder if emails not appearing
- [ ] Monitor email sending limits
- [ ] Set up domain authentication (for production)

---

## 📖 Code Examples

### Send Custom Email:

```typescript
import { sendEmail } from '@/lib/email-service';

await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Email',
  html: '<h1>Hello!</h1><p>Your message here</p>',
});
```

### Check If Email Configured:

```typescript
const isConfigured = process.env.SMTP_USER && process.env.SMTP_PASSWORD;
```

---

## 🔐 Security Best Practices

1. ✅ **Never commit SMTP credentials** to git
2. ✅ Use app-specific passwords, not main passwords
3. ✅ Rotate credentials every 90 days
4. ✅ Monitor email sending for abuse
5. ✅ Set up SPF/DKIM records for production
6. ✅ Use rate limiting on email endpoints

---

## 🆘 Support

If you need help:

1. Check Railway logs for email errors
2. Verify SMTP credentials
3. Test with Gmail first (easiest)
4. Check provider documentation
5. Review email templates in `lib/email-service.ts`

---

**Last Updated:** 2025-11-25
**Email System:** Fully Functional
**Admin 2FA:** Enabled
