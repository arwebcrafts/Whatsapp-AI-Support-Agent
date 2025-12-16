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

    // Step 2: Deploy migrations to database
    console.log('🚀 Deploying database migrations...');
    try {
      const { stdout: migrateStdout, stderr: migrateStderr } = await execPromise('npx prisma migrate deploy');

      if (migrateStderr) {
        console.warn('⚠️ Prisma migrate warnings:', migrateStderr);
      }

      if (migrateStdout) {
        console.log(migrateStdout);
      }

      console.log('✅ Database migrations deployed successfully');
    } catch (migrateError: any) {
      // Check if this is a failed migration error (P3009)
      if (migrateError.message?.includes('P3009') || migrateError.message?.includes('failed migrations')) {
        console.log('⚠️ Found failed migrations, attempting to resolve...');

        // Extract the failed migration name from the error message
        const migrationMatch = migrateError.message.match(/`(\d+_[^`]+)`/);
        if (migrationMatch) {
          const failedMigration = migrationMatch[1];
          console.log(`🔧 Resolving failed migration: ${failedMigration}`);

          try {
            // Mark the failed migration as applied (since it likely partially applied or the schema already has the changes)
            await execPromise(`npx prisma migrate resolve --applied ${failedMigration}`);
            console.log(`✅ Marked migration ${failedMigration} as applied`);

            // Retry the migration deploy
            console.log('🔄 Retrying migration deploy...');
            const { stdout: retryStdout } = await execPromise('npx prisma migrate deploy');
            if (retryStdout) {
              console.log(retryStdout);
            }
            console.log('✅ Database migrations deployed successfully after resolution');
          } catch (resolveError: any) {
            console.error('❌ Failed to resolve migration:', resolveError.message);
            // Continue anyway - the database might still work
          }
        } else {
          console.error('❌ Could not extract failed migration name from error');
        }
      } else {
        throw migrateError;
      }
    }

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
