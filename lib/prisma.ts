import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Production-ready Prisma configuration with connection pooling
// Connection pool is configured via DATABASE_URL parameters:
// - connection_limit: Max connections (default: 10, recommended: 20-30 for production)
// - pool_timeout: Wait time for available connection (default: 10s, recommended: 30s)
// - connect_timeout: Connection establishment timeout (default: 5s, recommended: 10s)
//
// Example DATABASE_URL format:
// mysql://user:pass@host:3306/db?connection_limit=25&pool_timeout=30&connect_timeout=10
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'], // Only log errors in production
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Log connection on first init (development only)
if (process.env.NODE_ENV === 'development') {
  prisma.$connect()
    .then(() => console.log('✅ Database connected successfully'))
    .catch((error) => console.error('❌ Database connection failed:', error))
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown - close connections when process terminates
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}
