/**
 * Migration Fix Script for Railway Deployment
 *
 * This script fixes failed Prisma migrations by:
 * 1. Checking for failed migrations in _prisma_migrations table
 * 2. Marking them as rolled back to allow Prisma to retry
 * 3. Optionally running prisma migrate deploy afterwards
 *
 * Usage:
 *   node fix-migration.js              - Just mark migrations as rolled back
 *   node fix-migration.js --deploy     - Also run prisma migrate deploy
 *   npm run fix:migration              - Via npm script
 */

const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Load environment variables if .env exists
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available or .env doesn't exist - that's OK for Railway
  console.log('ℹ️  Running without .env file (using environment variables)');
}

const shouldDeploy = process.argv.includes('--deploy');

async function fixMigration() {
  console.log('🔧 Railway Migration Fix Tool\n');
  console.log('═'.repeat(60));

  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set!');
    console.error('On Railway, this should be automatically set.');
    console.error('Locally, create a .env file with your DATABASE_URL');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL found');

  // Parse MySQL connection URL
  // Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE or mysql://USER:PASSWORD@HOST:PORT/DATABASE?param=value
  const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);

  if (!urlMatch) {
    console.error('\n❌ ERROR: Invalid DATABASE_URL format');
    console.error('Expected format: mysql://USER:PASSWORD@HOST:PORT/DATABASE');
    console.error(`Received: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    process.exit(1);
  }

  const [, user, password, host, port, database] = urlMatch;

  console.log(`📡 Connecting to: ${user}@${host}:${port}/${database}`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database,
      connectTimeout: 10000, // 10 second timeout
    });

    console.log('✅ Connected to database\n');
    console.log('═'.repeat(60));

    // Check if _prisma_migrations table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE '_prisma_migrations'"
    );

    if (tables.length === 0) {
      console.log('\n⚠️  _prisma_migrations table does not exist.');
      console.log('This might be a fresh database.');
      console.log('\n💡 Running prisma migrate deploy to initialize...\n');

      if (shouldDeploy) {
        await runMigrateDeploy();
      } else {
        console.log('Skipping deploy (use --deploy flag to run migrations)');
      }
      process.exit(0);
    }

    // Check current migration status
    console.log('\n📊 Current migration status:\n');
    const [allMigrations] = await connection.execute(
      'SELECT migration_name, started_at, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 10'
    );

    if (allMigrations.length === 0) {
      console.log('No migrations found in database.');
    } else {
      console.table(allMigrations.map(m => ({
        name: m.migration_name,
        started: m.started_at ? new Date(m.started_at).toISOString() : 'N/A',
        finished: m.finished_at ? '✅ Done' : '❌ Failed',
        rolled_back: m.rolled_back_at ? '🔄 Yes' : '-'
      })));
    }

    console.log('\n' + '═'.repeat(60));

    // Find ALL failed migrations (not just the specific one)
    const [failedMigrations] = await connection.execute(
      'SELECT * FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL'
    );

    if (failedMigrations.length === 0) {
      console.log('\n✅ No failed migrations found!');
      console.log('Your database migration state is clean.\n');

      if (shouldDeploy) {
        console.log('Running prisma migrate deploy to ensure all migrations are applied...\n');
        await runMigrateDeploy();
      }

      process.exit(0);
    }

    // Found failed migrations - fix them
    console.log(`\n⚠️  Found ${failedMigrations.length} failed migration(s):\n`);
    failedMigrations.forEach(m => {
      console.log(`  - ${m.migration_name}`);
    });

    console.log('\n🔧 Marking failed migrations as rolled back...\n');

    // Mark each failed migration as rolled back
    for (const migration of failedMigrations) {
      await connection.execute(
        `UPDATE _prisma_migrations
         SET rolled_back_at = NOW(),
             logs = CONCAT(
               COALESCE(logs, ''),
               '\n[${new Date().toISOString()}] Automatically rolled back due to P3009 error (failed migration blocking deployment)'
             )
         WHERE migration_name = ? AND finished_at IS NULL AND rolled_back_at IS NULL`,
        [migration.migration_name]
      );
      console.log(`  ✅ Rolled back: ${migration.migration_name}`);
    }

    // Show updated status
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 Updated migration status:\n');
    const [updatedMigrations] = await connection.execute(
      'SELECT migration_name, started_at, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 10'
    );
    console.table(updatedMigrations.map(m => ({
      name: m.migration_name,
      started: m.started_at ? new Date(m.started_at).toISOString() : 'N/A',
      finished: m.finished_at ? '✅ Done' : '❌ Failed',
      rolled_back: m.rolled_back_at ? '🔄 Yes' : '-'
    })));

    console.log('\n' + '═'.repeat(60));
    console.log('\n✅ Migration fix completed successfully!\n');

    // Run migrate deploy if requested
    if (shouldDeploy) {
      console.log('🚀 Running prisma migrate deploy...\n');
      await runMigrateDeploy();
    } else {
      console.log('💡 Next steps:');
      console.log('  1. Run: npx prisma migrate deploy');
      console.log('  2. Or restart your Railway deployment');
      console.log('  3. The server should now start without P3009 errors\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n💡 The _prisma_migrations table does not exist.');
      console.error('This might mean the database is completely new.');
      console.error('\nTry running: npx prisma migrate deploy');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Could not connect to the database.');
      console.error('Make sure your database server is running and DATABASE_URL is correct.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Database access denied.');
      console.error('Check your database credentials in DATABASE_URL');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      console.error('\n💡 Could not reach the database server.');
      console.error('Check your network connection and database host');
    }

    console.error('\n🔍 For Railway deployment issues:');
    console.error('  1. Check your Railway service logs');
    console.error('  2. Verify DATABASE_URL is set correctly');
    console.error('  3. Ensure your MySQL database is running\n');

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed\n');
    }
  }
}

async function runMigrateDeploy() {
  try {
    console.log('Running: npx prisma migrate deploy\n');
    const { stdout, stderr } = await execPromise('npx prisma migrate deploy');

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('\n✅ Prisma migrate deploy completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Prisma migrate deploy failed:');
    console.error(error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

// Main execution
(async () => {
  try {
    // Check if mysql2 is installed
    require.resolve('mysql2/promise');
    await fixMigration();
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error('❌ mysql2 package is not installed.');
      console.error('\nPlease install it first:');
      console.error('  npm install mysql2');
      console.error('\nThen run this script again:');
      console.error('  node fix-migration.js\n');
      process.exit(1);
    } else {
      throw e;
    }
  }
})();
