import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Production-ready Prisma configuration with connection pooling
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
