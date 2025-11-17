#!/usr/bin/env node

/**
 * Direct Database Cleanup for Failed Migrations
 * Bypasses Prisma CLI to directly clean the _prisma_migrations table
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const MIGRATION_NAME = '20251115213700_init';

async function cleanupFailedMigration() {
  console.log('🛑 Cleaning Up Failed Migration...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('Please ensure your .env file contains DATABASE_URL\n');
    process.exit(1);
  }

  let connection;

  try {
    // Parse DATABASE_URL
    const dbUrl = new URL(process.env.DATABASE_URL);
    const config = {
      host: dbUrl.hostname,
      port: dbUrl.port || 3306,
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1), // Remove leading '/'
    };

    console.log(`📡 Connecting to database: ${config.database}@${config.host}\n`);

    connection = await mysql.createConnection(config);

    // Step 1: Check current status
    console.log('Step 1: Checking current migration status...\n');
    const [migrations] = await connection.execute(
      `SELECT migration_name, started_at, finished_at, rolled_back_at
       FROM _prisma_migrations
       WHERE migration_name = ?`,
      [MIGRATION_NAME]
    );

    if (migrations.length === 0) {
      console.log('✅ No failed migration found. Database is clean.\n');
      return;
    }

    console.log('Found migration record:');
    console.table(migrations);
    console.log('');

    // Step 2: Mark as rolled back
    console.log('Step 2: Marking migration as rolled back...\n');
    const [result] = await connection.execute(
      `UPDATE _prisma_migrations
       SET rolled_back_at = NOW(),
           finished_at = NULL
       WHERE migration_name = ?
         AND finished_at IS NULL`,
      [MIGRATION_NAME]
    );

    if (result.affectedRows > 0) {
      console.log('✅ Migration marked as rolled back!\n');
    } else {
      // If update didn't work, try delete
      console.log('⚠️  Update had no effect, removing migration record...\n');
      const [deleteResult] = await connection.execute(
        `DELETE FROM _prisma_migrations WHERE migration_name = ?`,
        [MIGRATION_NAME]
      );

      if (deleteResult.affectedRows > 0) {
        console.log('✅ Migration record deleted!\n');
      } else {
        console.log('⚠️  No changes made. Migration may already be resolved.\n');
      }
    }

    // Step 3: Verify cleanup
    console.log('Step 3: Verifying cleanup...\n');
    const [verifyMigrations] = await connection.execute(
      `SELECT migration_name, started_at, finished_at, rolled_back_at
       FROM _prisma_migrations
       WHERE migration_name = ?`,
      [MIGRATION_NAME]
    );

    if (verifyMigrations.length === 0) {
      console.log('✅ Migration record removed from database\n');
    } else {
      console.log('Current status:');
      console.table(verifyMigrations);
      console.log('');
    }

    // Step 4: Check for other failed migrations
    console.log('Step 4: Checking for other failed migrations...\n');
    const [failedMigrations] = await connection.execute(
      `SELECT migration_name, started_at
       FROM _prisma_migrations
       WHERE finished_at IS NULL
         AND rolled_back_at IS NULL`
    );

    if (failedMigrations.length > 0) {
      console.log('⚠️  Other failed migrations found:');
      console.table(failedMigrations);
      console.log('');
    } else {
      console.log('✅ No other failed migrations found\n');
    }

    console.log('🎉 Cleanup complete!\n');
    console.log('Next steps:');
    console.log('  1. Review your Prisma schema');
    console.log('  2. When ready, run: npx prisma migrate deploy');
    console.log('  3. Or generate a new migration: npx prisma migrate dev\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Run the SQL script directly:');
    console.log('   mysql -u [user] -p [database] < cleanup-failed-migrations.sql\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanupFailedMigration();
