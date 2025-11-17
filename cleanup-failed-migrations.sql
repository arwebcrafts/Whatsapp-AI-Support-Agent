-- Cleanup Failed Prisma Migrations
-- This SQL script removes failed migration records from the database

-- Step 1: Check current migration status
SELECT
    migration_name,
    started_at,
    finished_at,
    rolled_back_at,
    CASE
        WHEN finished_at IS NOT NULL THEN 'Applied'
        WHEN rolled_back_at IS NOT NULL THEN 'Rolled Back'
        ELSE 'Failed/Pending'
    END as status
FROM _prisma_migrations
ORDER BY started_at DESC
LIMIT 10;

-- Step 2: View the specific failed migration
SELECT * FROM _prisma_migrations
WHERE migration_name = '20251115213700_init';

-- Step 3: OPTION A - Mark migration as rolled back (RECOMMENDED)
UPDATE _prisma_migrations
SET rolled_back_at = NOW(),
    finished_at = NULL
WHERE migration_name = '20251115213700_init'
  AND finished_at IS NULL;

-- Step 4: OPTION B - Completely remove the failed migration record (USE WITH CAUTION)
-- Uncomment the line below only if OPTION A doesn't work
-- DELETE FROM _prisma_migrations WHERE migration_name = '20251115213700_init';

-- Step 5: Verify cleanup
SELECT
    migration_name,
    started_at,
    finished_at,
    rolled_back_at,
    CASE
        WHEN finished_at IS NOT NULL THEN 'Applied'
        WHEN rolled_back_at IS NOT NULL THEN 'Rolled Back'
        ELSE 'Failed/Pending'
    END as status
FROM _prisma_migrations
WHERE migration_name = '20251115213700_init';

-- Step 6: Check if there are any other failed migrations
SELECT migration_name, started_at
FROM _prisma_migrations
WHERE finished_at IS NULL
  AND rolled_back_at IS NULL;
