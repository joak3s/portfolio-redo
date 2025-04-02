#!/bin/bash

# Docker migration helper script for Supabase
# This runs SQL migrations directly against the Supabase Docker container,
# bypassing the supabase migration system when needed.

set -e

# Check if a file argument was provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 <path-to-migration-file.sql>"
  exit 1
fi

MIGRATION_FILE=$1

# Verify file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: File '$MIGRATION_FILE' not found"
  exit 1
fi

# Get the Supabase DB container ID
CONTAINER_ID=$(docker ps | grep supabase_db | awk '{print $1}')

if [ -z "$CONTAINER_ID" ]; then
  echo "Error: Supabase database container not found. Is Supabase running?"
  exit 1
fi

echo "Found Supabase DB container: $CONTAINER_ID"
echo "Running migration: $MIGRATION_FILE"

# Execute the migration
cat "$MIGRATION_FILE" | docker exec -i "$CONTAINER_ID" psql -U postgres -d postgres

# Check for errors
if [ $? -eq 0 ]; then
  echo "✅ Migration applied successfully"
else
  echo "❌ Migration failed"
  exit 1
fi 