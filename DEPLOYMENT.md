# Production Deployment Guide

## Prerequisites
- Vercel account (frontend)
- Railway or Render account (backend)
- Supabase project (database + auth)
- Domain name (optional)

## Environment Variables

### Vercel (Frontend)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (Railway/Render)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
GOOGLE_MAPS_API_KEY=your-api-key
ML_INFERENCE_URL=https://your-hf-space.hf.space
FCM_SERVER_KEY=your-fcm-key
RESEND_API_KEY=your-resend-key
MSG91_AUTH_KEY=your-msg91-key
SENTRY_DSN=your-sentry-dsn
```

## Steps

### 1. Database Setup
```bash
# Run migrations
supabase db push

# Seed data (optional)
supabase db seed
```

### 2. Deploy Backend
- Connect GitHub repo to Railway/Render
- Set environment variables
- Deploy to production

### 3. Deploy Frontend
- Connect GitHub repo to Vercel
- Set environment variables
- Enable automatic deployments

### 4. Configure Webhooks
- Razorpay webhook: `https://your-domain.com/api/payments/webhook`
- Set webhook secret in environment

### 5. Enable RLS Policies
- Review and enable RLS policies in Supabase
- Test with authenticated users

### 6. Configure Integrations
- Razorpay: Enable live mode
- MSG91: Verify sender ID
- Resend: Verify domain
- Google Maps: Enable Distance Matrix API
- HuggingFace: Deploy ML Space

### 7. Monitoring
- Sentry: Error tracking
- Axiom: Log aggregation
- UptimeRobot: Uptime monitoring

## Verification
```bash
# Test health endpoints
curl https://your-api.com/api/health

# Test webhooks
# Use Razorpay webhook testing tool

# Monitor logs
# Check Sentry for errors
```
