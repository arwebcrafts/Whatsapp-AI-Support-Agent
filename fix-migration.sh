#!/bin/bash

# Fix Prisma Migration P3018 Error
# This script resolves the "Table already exists" migration conflict

set -e

MIGRATION_NAME="20251115213700_init"

echo "🔧 Fixing Prisma Migration Conflict..."
echo ""
echo "Migration: $MIGRATION_NAME"
echo "Error: Table 'users' already exists (P3018)"
echo ""

# Set environment variable to ignore checksum issues
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

echo "Step 1: Marking migration as applied..."
echo "Running: npx prisma migrate resolve --applied \"$MIGRATION_NAME\""
echo ""

if npx prisma migrate resolve --applied "$MIGRATION_NAME"; then
  echo ""
  echo "✅ Migration marked as applied successfully!"
  echo ""
  echo "Step 2: Deploying remaining migrations..."
  echo ""

  if npx prisma migrate deploy; then
    echo ""
    echo "✅ All migrations deployed successfully!"
    echo ""
    echo "🎉 Migration conflict resolved!"
  else
    echo ""
    echo "⚠️  Some migrations may still need attention"
    echo "Check the error messages above for details"
  fi
else
  echo ""
  echo "❌ Failed to mark migration as applied"
  echo ""
  echo "Manual fix options:"
  echo ""
  echo "Option 1: Run this command directly:"
  echo "  PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma migrate resolve --applied \"$MIGRATION_NAME\""
  echo ""
  echo "Option 2: Use SQL to manually update _prisma_migrations table"
  echo "  Run: node fix-migration-conflict.js"
  echo ""
  exit 1
fi
