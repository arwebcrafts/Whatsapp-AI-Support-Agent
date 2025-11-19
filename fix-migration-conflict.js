#!/usr/bin/env node

/**
 * Fix Prisma Migration Conflict - P3018 Error
 *
 * This script helps resolve the "Table already exists" error
 * by marking the failed migration as applied in the database.
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const MIGRATION_NAME = '20251115213700_init';

console.log('🔧 Prisma Migration Conflict Fix Tool\n');
console.log('❌ Current Issue:');
console.log(`   Migration "${MIGRATION_NAME}" failed because table 'users' already exists\n`);

console.log('📋 Available Solutions:\n');
console.log('1. Mark migration as applied (if tables already exist with correct schema)');
console.log('2. Create SQL script to manually fix the _prisma_migrations table');
console.log('3. Show manual steps to resolve the issue');
console.log('4. Exit\n');

rl.question('Choose an option (1-4): ', (answer) => {
  switch(answer.trim()) {
    case '1':
      markMigrationAsApplied();
      break;
    case '2':
      createFixScript();
      break;
    case '3':
      showManualSteps();
      break;
    case '4':
      console.log('Exiting...');
      rl.close();
      break;
    default:
      console.log('Invalid option. Exiting...');
      rl.close();
  }
});

function markMigrationAsApplied() {
  console.log('\n🔄 Marking migration as applied...\n');

  try {
    // Set environment variable to ignore checksum issues
    process.env.PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = '1';

    const cmd = `npx prisma migrate resolve --applied "${MIGRATION_NAME}"`;
    console.log(`Running: ${cmd}\n`);

    execSync(cmd, {
      stdio: 'inherit',
      env: {
        ...process.env,
        PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1'
      }
    });

    console.log('\n✅ Migration marked as applied!');
    console.log('\n📌 Next steps:');
    console.log('   1. Run: npx prisma migrate deploy');
    console.log('   2. Verify all migrations are applied successfully\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Try option 2 or 3 to resolve manually\n');
  }

  rl.close();
}

function createFixScript() {
  console.log('\n📝 Creating SQL fix script...\n');

  const sqlScript = `-- Fix Prisma Migration Conflict
-- Run this SQL script directly in your MySQL database

-- Check current migration status
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;

-- Mark the failed migration as applied
INSERT INTO _prisma_migrations (
  id,
  checksum,
  finished_at,
  migration_name,
  logs,
  rolled_back_at,
  started_at,
  applied_steps_count
) VALUES (
  UUID(),
  '${getMigrationChecksum()}',
  NOW(),
  '${MIGRATION_NAME}',
  NULL,
  NULL,
  NOW(),
  1
) ON DUPLICATE KEY UPDATE
  finished_at = NOW(),
  logs = NULL,
  rolled_back_at = NULL;

-- Verify the migration was marked as applied
SELECT * FROM _prisma_migrations WHERE migration_name = '${MIGRATION_NAME}';
`;

  const fs = require('fs');
  const scriptPath = './fix-migration-p3018.sql';
  fs.writeFileSync(scriptPath, sqlScript);

  console.log(`✅ SQL script created: ${scriptPath}`);
  console.log('\n📌 To apply this fix:');
  console.log('   1. Connect to your MySQL database');
  console.log(`   2. Run: source ${scriptPath}`);
  console.log('   3. Then run: npx prisma migrate deploy\n');

  rl.close();
}

function showManualSteps() {
  console.log('\n📖 Manual Resolution Steps:\n');
  console.log('Step 1: Mark the migration as resolved');
  console.log('   npx prisma migrate resolve --applied "20251115213700_init"\n');

  console.log('Step 2: Deploy remaining migrations');
  console.log('   npx prisma migrate deploy\n');

  console.log('Alternative: Direct SQL approach');
  console.log('   1. Connect to your database');
  console.log('   2. Check _prisma_migrations table:');
  console.log('      SELECT * FROM _prisma_migrations;');
  console.log('   3. Manually insert or update the migration record\n');

  console.log('⚠️  Important Notes:');
  console.log('   • Only use this if tables already exist with correct schema');
  console.log('   • Verify table structure matches the migration file');
  console.log('   • Backup your database before making changes\n');

  rl.close();
}

function getMigrationChecksum() {
  // This is a placeholder - actual checksum should be calculated
  // from the migration file content
  const crypto = require('crypto');
  const fs = require('fs');

  try {
    const migrationPath = `./prisma/migrations/${MIGRATION_NAME}/migration.sql`;
    const content = fs.readFileSync(migrationPath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return 'PLACEHOLDER_CHECKSUM_' + Date.now();
  }
}
