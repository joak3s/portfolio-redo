#!/bin/bash

echo "Applying Journey Milestone SQL functions to Supabase..."

# 1. Check required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Required environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  exit 1
fi

# 2. Apply the SQL functions using psql
# Path to the SQL file
SQL_FILE="./supabase/migrations/new/journey-milestone-functions.sql"

# Extract DB connection details from Supabase URL
DB_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's/https?:\/\/([^:]+):.*/\1/g')
DB_PORT="5432" # Default port for PostgreSQL
DB_NAME="postgres" # Default database name for Supabase
DB_USER="postgres" # Default user for Supabase with service role

# Get password from service role key
# This is a simplification - you might need to adjust based on your authentication setup
DB_PASSWORD=$SUPABASE_SERVICE_ROLE_KEY

echo "Connecting to Supabase PostgreSQL database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SQL_FILE

if [ $? -eq 0 ]; then
  echo "✅ Successfully applied SQL functions!"
  echo "You can now create journey milestones using the new API."
else
  echo "❌ Failed to apply SQL functions. Check the error messages above."
  exit 1
fi

# Make this script executable
chmod +x $0 