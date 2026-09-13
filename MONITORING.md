# Monitoring Setup Guide

## Sentry (Error Tracking)

### Install
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest
```

### Configure
Set `SENTRY_DSN` in environment variables.

### Verify
Check Sentry dashboard for errors.

## Axiom (Log Aggregation)

### Install
```bash
npm install @axiomhq/nextjs
```

### Configure
Set `AXIOM_TOKEN` and `AXIOM_DATASET` environment variables.

## UptimeRobot (Uptime Monitoring)

1. Create account at uptimerobot.com
2. Add monitor for `https://your-domain.com`
3. Set check interval: 5 minutes
4. Configure alerts (email, SMS)

## Performance Monitoring

### Vercel Analytics
- Enable in Vercel dashboard
- View in Vercel Analytics tab

### Supabase Monitoring
- Check dashboard for slow queries
- Monitor connection pool

## Alerting

### Critical Alerts
- API error rate > 1%
- Database CPU > 80%
- Disk usage > 90%

### Warning Alerts
- API response time > 2s
- Database queries > 1s
- Failed payments > 5/min

## Incident Response

### Severity 1 (Critical)
- Service completely down
- Response time: Immediate
- Action: Page on-call engineer

### Severity 2 (Major)
- Major feature broken
- Response time: 1 hour
- Action: Notify engineering team

### Severity 3 (Minor)
- Minor issue
- Response time: 24 hours
- Action: Add to backlog
