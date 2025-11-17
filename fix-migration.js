/**
 * Manual Migration Fix Script
 *
 * This script fixes the failed Prisma migration by directly updating
 * the _prisma_migrations table to mark the failed migration as rolled back.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixMigration() {
  console.log('🔧 Starting migration fix...\n');

  // Parse DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
    console.error('Please create a .env file with your DATABASE_URL');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL found');

  // Parse MySQL connection URL
  // Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
  const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

  if (!urlMatch) {
    console.error('❌ ERROR: Invalid DATABASE_URL format');
    console.error('Expected format: mysql://USER:PASSWORD@HOST:PORT/DATABASE');
    process.exit(1);
  }

  const [, user, password, host, port, database] = urlMatch;

  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database
  });

  try {
    console.log('✓ Connected to database\n');

    // Check current migration status
    console.log('Checking current migration status...');
    const [migrations] = await connection.execute(
      'SELECT migration_name, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5'
    );

    console.log('\nCurrent migrations:');
    console.table(migrations);

    // Check for the specific failed migration
    const [failedMigrations] = await connection.execute(
      'SELECT * FROM _prisma_migrations WHERE migration_name = ? AND finished_at IS NULL AND rolled_back_at IS NULL',
      ['20251115213700_init']
    );

    if (failedMigrations.length === 0) {
      console.log('\n✓ No failed migration found for 20251115213700_init');
      console.log('The migration issue may already be resolved.');
    } else {
      console.log('\n⚠️  Found failed migration: 20251115213700_init');
      console.log('Marking it as rolled back...\n');

      // Mark the migration as rolled back
      await connection.execute(
        `UPDATE _prisma_migrations
         SET rolled_back_at = NOW(),
             logs = CONCAT(COALESCE(logs, ''), '\nManually rolled back due to P3009 error on ${new Date().toISOString()}')
         WHERE migration_name = ? AND finished_at IS NULL AND rolled_back_at IS NULL`,
        ['20251115213700_init']
      );

      console.log('✅ Migration marked as rolled back!');
    }

    // Show updated status
    console.log('\nUpdated migration status:');
    const [updatedMigrations] = await connection.execute(
      'SELECT migration_name, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5'
    );
    console.table(updatedMigrations);

    console.log('\n✅ Migration fix completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run start (or npx prisma migrate deploy)');
    console.log('2. The server should now start without errors\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('\n💡 The _prisma_migrations table does not exist yet.');
      console.error('This might mean the database is completely new.');
      console.error('Try running: npx prisma migrate deploy');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Could not connect to the database.');
      console.error('Make sure your database server is running and DATABASE_URL is correct.');
    }

    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Check if mysql2 is installed
try {
  require.resolve('mysql2/promise');
  fixMigration();
} catch (e) {
  console.error('❌ mysql2 package is not installed.');
  console.error('\nPlease install it first:');
  console.error('  npm install mysql2');
  console.error('\nThen run this script again:');
  console.error('  node fix-migration.js\n');
  process.exit(1);
}
