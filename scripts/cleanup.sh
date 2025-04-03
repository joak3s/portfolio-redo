#!/bin/bash

# Cleanup script for migration files that are no longer needed

echo "Starting migration files cleanup..."

# 1. Remove duplicate journey_milestones files (keep only the latest)
echo "Removing older journey_milestones migration..."
rm -f supabase/migrations/20240917_journey_milestones.sql
echo "Kept the newer version: 20250327232627_journey_milestones.sql"

# 2. Remove duplicate updated_at trigger files (keep only the latest)
echo "Removing older updated_at trigger migration..."
rm -f supabase/migrations/20250404_add_updated_at_trigger.sql
echo "Kept the newer version: 20250405_add_updated_at_trigger.sql"

# 3. Remove duplicate public bucket migrations (keep only the latest)
echo "Removing older public bucket migration..."
rm -f supabase/migrations/20250403_create_public_bucket.sql
echo "Kept the newer version: 20250406_create_public_bucket.sql"

echo "Migration cleanup completed successfully!"

# Make the script executable after creation
chmod +x $(dirname "$0")/cleanup.sh 