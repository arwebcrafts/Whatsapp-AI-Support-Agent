-- ============================================================================
-- Prisma Migration Fix Script
-- ============================================================================
-- This script fixes the P3009 error by marking the failed migration as rolled back
--
-- HOW TO RUN THIS SCRIPT:
-- 1. Connect to your MySQL database using MySQL CLI or any MySQL client
-- 2. Run this script
-- 3. Then run: npx prisma migrate deploy
-- 4. Your server should now start successfully
-- ============================================================================

-- First, let's see the current migration status
SELECT
migration_name,
    finished_at,
    rolled_back_at,
    applied_steps_count,
    started_at
FROM _prisma_migrations
ORDER BY started_at DESC
LIMIT 10;

-- Mark the failed migration as rolled back
UPDATE _prisma_migrations
SET
    rolled_back_at = NOW(),
    logs = CONCAT(
        COALESCE(logs, ''),
        '\nManually rolled back due to P3009 error on ',
        NOW()
    )
WHERE migration_name = '20251115213700_init'
  AND finished_at IS NULL
  AND rolled_back_at IS NULL;

-- Verify the fix
SELECT
    migration_name,
    finished_at,
    rolled_back_at,
    applied_steps_count
FROM _prisma_migrations
WHERE migration_name = '20251115213700_init';

-- Show all migrations status
SELECT
    migration_name,
    finished_at,
    rolled_back_at,
    applied_steps_count
FROM _prisma_migrations
ORDER BY started_at DESC;
