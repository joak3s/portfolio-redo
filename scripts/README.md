# Supabase Database Management

This README documents the approaches we've discovered for managing and updating Supabase database schemas and data in the local development environment.

## Overview

While Supabase provides a standard migration system, we've found a combination of approaches to be most effective for this project's setup:

1. **SQL Migration Files** - For schema changes
2. **Direct Postgres Container Access** - For when migration tools fail
3. **Custom TypeScript Scripts** - For complex data operations
4. **Supabase CLI Commands** - For managing and repairing migrations

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

### Method 4: Supabase CLI Direct Commands

For managing migrations, especially when syncing local and remote databases:

```bash
# Push local migrations to remote
supabase db push

# List migration status
supabase migration list

# Repair migration history
supabase migration repair --status applied migration_id

# Pull schema from remote
supabase db pull
```

**Best for**: Managing migration history and syncing between local and remote environments.

## Working with Supabase CLI

### Installation

```bash
# Install via Homebrew
brew install supabase/tap/supabase

# Add to PATH if needed (macOS)
export PATH="/opt/homebrew/bin:$PATH"
```

### Common Workflows

#### Pushing New Migrations

```bash
# Create a new migration
supabase migration new my_migration_name

# Edit the migration file (add your SQL)
nano supabase/migrations/[timestamp]_my_migration_name.sql

# Push to remote
supabase db push
```

#### Repairing Migration History

If migrations are out of sync between local and remote:

```bash
# List migrations to see status
supabase migration list

# Repair a specific migration
supabase migration repair --status applied [migration_id]
```

#### Handling Migration Conflicts

When you encounter errors pushing migrations:

1. Check migration status with `supabase migration list`
2. Identify the conflicting migration
3. Repair as needed with `supabase migration repair`
4. Push again with `supabase db push`

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

### Example 3: Creating Functions for Tool Management

Adding helper functions for common operations:

```sql
-- Function to add a tool with icon
CREATE OR REPLACE FUNCTION add_tool(
  tool_name TEXT,
  tool_icon TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  tool_id UUID;
BEGIN
  -- Insert the tool if it doesn't exist
  INSERT INTO tools (name, icon)
  VALUES (tool_name, tool_icon)
  ON CONFLICT (name) 
  DO UPDATE SET icon = EXCLUDED.icon
  RETURNING id INTO tool_id;
  
  RETURN tool_id;
END;
$$ LANGUAGE plpgsql;
```

## Troubleshooting

1. **Migration Conflicts**: When a migration fails due to existing objects, use the direct container approach.

2. **Hard to Debug Errors**: Connect directly to the database for investigation:
   ```bash
   docker exec -it supabase_db_[container_id] psql -U postgres -d postgres
   ```

3. **Complex Data Updates**: Consider writing a TypeScript script that uses the Supabase client.

4. **Out of Sync Migrations**: Use `supabase migration repair` to fix the migration history.

5. **Migration Status Check**: Run `supabase migration list` to compare local vs. remote status.

## Best Practices

1. **Version Control**: Always keep migrations in version control.

2. **Idempotent Migrations**: Write migrations that can run multiple times without errors.

3. **Small, Focused Changes**: Make each migration focus on a specific change.

4. **Test Locally First**: Always test migrations in the local development environment.

5. **Backup**: Before running migrations in production, ensure you have backups.

6. **Migration Repair**: Don't hesitate to use `supabase migration repair` when needed.

7. **Clear Naming**: Use descriptive names for migration files that indicate their purpose.

8. **Documentation**: Add comments to your migration files explaining complex operations.

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

# Supabase migrations
supabase migration new name_of_migration
supabase migration list
supabase migration repair --status applied migration_id

# Supabase database operations
supabase db push
supabase db pull
supabase db remote tables
supabase db diff --use-migra --linked
```

## Recent Learnings from Portfolio Migration Project

### Migration Repair Workflow

When migrations fail or are out of sync between local and remote environments, this sequence has proven effective:

1. Run `supabase migration list` to understand the current state
2. For each missing/applied migration in remote but not local:
   ```bash
   supabase migration repair --status applied [migration_id]
   ```
3. Re-try `supabase db push` to apply new migrations

### Effective Migration Content Structure

Structure your migrations in this order to minimize failures:

1. Schema modifications (tables, columns)
2. Function definitions 
3. Trigger creation
4. View definitions
5. Data operations

This order reduces dependencies and allows for cleaner migrations.

### Handling Tool Path Issues

When encountering path issues with Supabase CLI:

```bash
# Use explicit path in commands
export PATH="/opt/homebrew/bin:$PATH" && supabase db push

# Or add to your shell profile for permanence
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
```

### Background vs. Foreground Execution

When pushing migrations that require confirmation:

```bash
# Use printf to pipe confirmation
printf 'y\n' | supabase db push

# OR use echo
echo 'y' | supabase db push
```

This allows you to automate confirmation prompts when needed. 