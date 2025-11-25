/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically executed when the Next.js server starts.
 * Perfect for database initialization and other startup tasks.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Server starting...');

    try {
      // Initialize database (runs Prisma migrations in production)
      const { initializeDatabase, checkDatabaseConnection } = await import('./lib/db-init');

      // Check if database is accessible first
      const isConnected = await checkDatabaseConnection();

      if (isConnected) {
        console.log('✅ Database is accessible');

        // Run migrations in production
        await initializeDatabase();
      } else {
        console.warn('⚠️ Database not accessible - skipping initialization');
        console.warn('💡 Check your DATABASE_URL environment variable');
      }
    } catch (error) {
      console.error('❌ Startup initialization error:', error);
      // Don't crash the app - let it start anyway
      console.warn('⚠️ App starting despite initialization errors');
    }

    console.log('✨ Server initialization complete');
  }
}
