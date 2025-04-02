# Supabase Database Management

This README documents the approaches we've discovered for managing and updating Supabase database schemas and data in the local development environment.

## Overview

While Supabase provides a standard migration system, we've found a combination of approaches to be most effective for this project's setup:

1. **SQL Migration Files** - For schema changes
2. **Direct Postgres Container Access** - For when migration tools fail
3. **Custom TypeScript Scripts** - For complex data operations

## Migration Methods

### Method 1: Standard Supabase Migrations

```bash
# Create a new migration
npx supabase migration new my_migration_name

# Apply all pending migrations
npx supabase migration up
```

**Best for**: Simple, initial schema changes that don't conflict with existing objects.

### Method 2: Direct Container Access

When the standard migration system fails (e.g., due to conflicts or dependency issues):

```bash
# Find the Supabase Postgres container
docker ps | grep supabase_db

# Execute SQL directly against the container
cat supabase/migrations/my_migration.sql | docker exec -i supabase_db_[container_id] psql -U postgres -d postgres
```

**Best for**: Applying migrations when the standard system fails with errors.

### Method 3: Custom Scripts

For complex data operations, custom TypeScript scripts can interact with Supabase:

```bash
# Run a TypeScript script
npx tsx scripts/update-journey-milestones.ts
```

**Best for**: Data migrations, complex updates, or operations that require application logic.

## Writing Robust Migrations

### Make Migrations Idempotent

Always use conditional logic to avoid errors on repeated runs:

```sql
-- Add a column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'my_table' 
    AND column_name = 'my_column'
  ) THEN
    ALTER TABLE my_table ADD COLUMN my_column TEXT;
  END IF;
END
$$;

-- Create objects with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS my_table (id UUID PRIMARY KEY DEFAULT uuid_generate_v4());

-- Use DO blocks for policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'my_table' 
    AND policyname = 'My Policy'
  ) THEN
    EXECUTE 'CREATE POLICY "My Policy" ON my_table FOR SELECT USING (true)';
  END IF;
END
$$;
```

## Real-World Examples

### Example 1: Adding an Updated_at Trigger

We added an `updated_at` column with an automatic update trigger:

```sql
-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'journey_milestones' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE journey_milestones 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END
$$;

-- Create the trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger
DROP TRIGGER IF EXISTS set_timestamp ON journey_milestones;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON journey_milestones
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
```

### Example 2: Setting Up Storage Buckets

Creating storage buckets with the proper permissions:

```sql
-- Create bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'public'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('public', 'public', true);
  END IF;
END
$$;

-- Set bucket properties
UPDATE storage.buckets
SET 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif']::text[]
WHERE id = 'public';
```

## Troubleshooting

1. **Migration Conflicts**: When a migration fails due to existing objects, use the direct container approach.

2. **Hard to Debug Errors**: Connect directly to the database for investigation:
   ```bash
   docker exec -it supabase_db_[container_id] psql -U postgres -d postgres
   ```

3. **Complex Data Updates**: Consider writing a TypeScript script that uses the Supabase client.

## Best Practices

1. **Version Control**: Always keep migrations in version control.

2. **Idempotent Migrations**: Write migrations that can run multiple times without errors.

3. **Small, Focused Changes**: Make each migration focus on a specific change.

4. **Test Locally First**: Always test migrations in the local development environment.

5. **Backup**: Before running migrations in production, ensure you have backups.

## Useful Commands

```bash
# List containers to find Postgres container ID
docker ps | grep supabase_db

# Direct SQL execution
cat path/to/file.sql | docker exec -i supabase_db_[container_id] psql -U postgres -d postgres

# Interactive Postgres session
docker exec -it supabase_db_[container_id] psql -U postgres -d postgres

# Run TypeScript scripts
npx tsx scripts/your-script.ts
``` 