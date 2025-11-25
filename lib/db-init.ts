import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Initialize database on app startup
 * Automatically runs Prisma migrations in production
 */
export async function initializeDatabase() {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('⏭️ Skipping database initialization (not production)');
    return;
  }

  // Skip if explicitly disabled
  if (process.env.SKIP_DB_INIT === 'true') {
    console.log('⏭️ Database initialization disabled via SKIP_DB_INIT');
    return;
  }

  console.log('🔄 Initializing database...');

  try {
    // Step 1: Generate Prisma Client
    console.log('📦 Generating Prisma Client...');
    const { stdout: genStdout, stderr: genStderr } = await execPromise('npx prisma generate');

    if (genStderr && !genStderr.includes('Generated Prisma Client')) {
      console.warn('⚠️ Prisma generate warnings:', genStderr);
    }

    console.log('✅ Prisma Client generated');

    // Step 2: Push schema to database
    console.log('🚀 Pushing schema to database...');
    const { stdout: pushStdout, stderr: pushStderr } = await execPromise('npx prisma db push --accept-data-loss --skip-generate');

    if (pushStderr) {
      console.warn('⚠️ Prisma push warnings:', pushStderr);
    }

    console.log('✅ Database schema synchronized');
    console.log('🎉 Database initialization complete!');

    return true;
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);

    // Don't crash the app - just log the error
    // The app can still start even if migrations fail
    console.warn('⚠️ App will start anyway - some features may not work until database is initialized');

    return false;
  }
}

/**
 * Check if database is accessible
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { prisma } = await import('./prisma');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
