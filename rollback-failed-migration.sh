#!/bin/bash

# Rollback Failed Prisma Migration - P3009 Error
# This script resolves the failed migration state

set -e

MIGRATION_NAME="20251115213700_init"

echo "🛑 Rolling Back Failed Migration..."
echo ""
echo "Migration: $MIGRATION_NAME"
echo "Error: P3009 - Migration marked as failed in database"
echo ""

# Set environment variable to ignore checksum issues
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

echo "Step 1: Marking migration as rolled back..."
echo "Running: npx prisma migrate resolve --rolled-back \"$MIGRATION_NAME\""
echo ""

if PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma migrate resolve --rolled-back "$MIGRATION_NAME" 2>&1; then
  echo ""
  echo "✅ Migration marked as rolled back successfully!"
  echo ""
  echo "📋 Migration state cleaned up"
  echo ""
  echo "Next steps:"
  echo "1. Fix any schema issues in your Prisma schema file"
  echo "2. When ready, run: npx prisma migrate deploy"
  echo ""
else
  echo ""
  echo "⚠️  Command failed, trying alternative approach..."
  echo ""
  echo "You may need to manually clean the _prisma_migrations table:"
  echo ""
  echo "SQL Command:"
  echo "  DELETE FROM _prisma_migrations WHERE migration_name = '$MIGRATION_NAME';"
  echo ""
  echo "Or update the failed record:"
  echo "  UPDATE _prisma_migrations SET rolled_back_at = NOW() WHERE migration_name = '$MIGRATION_NAME';"
  echo ""
fi
