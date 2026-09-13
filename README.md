# Kaarya — Cooperative Operations Platform

## Quick Start

### Prerequisites
- Node.js 20+
- Supabase project
- npm or yarn

### Installation
```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm run test
```

### Build
```bash
npm run build
```

### Type Check
```bash
npm run typecheck
```

## Deployment

### Vercel (Frontend)
1. Connect repository to Vercel
2. Set environment variables
3. Deploy

### Docker
```bash
docker build -t kaarya .
docker run -p 3000:3000 kaarya
```

### Supabase Migrations
```bash
supabase migration up
```

## ML Pipeline

See [ml/README.md](ml/README.md) for training and deployment instructions.

## Flutter Apps

- Worker app: `flutter_apps/worker_app/`
- Customer app: `flutter_apps/customer_app/`

## Documentation

- [PRD.md](PRD.md) — Product requirements
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) — Progress tracking

## License

MIT
