#!/bin/bash

# Script to export the journey restructure migration to a file that can be run in the Supabase SQL Editor

echo "Exporting the journey restructure migration..."

# Create the output directory if it doesn't exist
mkdir -p ./exports

# Copy the migration file
cp ./supabase/migrations/20250408000000_journey_restructure.sql ./exports/journey_restructure_for_production.sql

echo "✅ Migration exported to: ./exports/journey_restructure_for_production.sql"
echo
echo "How to apply this migration to your production Supabase instance:"
echo
echo "1. Go to your Supabase dashboard: https://app.supabase.com/project/lgtldjzglbzlmmxphfxw"
echo "2. Navigate to the SQL Editor"
echo "3. Create a new query"
echo "4. Open the exported file: ./exports/journey_restructure_for_production.sql"
echo "5. Copy and paste its contents into the SQL Editor"
echo "6. Run the query"
echo
echo "This will restructure your journey system by:"
echo "- Dropping the old journey_milestones table"
echo "- Creating new journey and journey_images tables"
echo "- Creating SQL functions for managing journey entries and images"
echo
echo "⚠️ Make sure to backup your data before running this migration in production!"

# Make this script executable
chmod +x $0 