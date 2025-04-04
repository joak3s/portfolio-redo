# Guide: Using Supabase CLI with Cursor AI to Manage Remote Supabase

This guide explains how to use Cursor with Claude to manage your remote Supabase instance via the Supabase CLI.

## Prerequisites

- Supabase CLI installed (`brew install supabase/tap/supabase`)
- Docker installed and running
- `.env.development` or `.env.local` file with correct Supabase credentials
- Login token for Supabase (acquired through `supabase login`)

## Authentication Setup

```bash
# Login to Supabase (this will open a browser window)
npx supabase login

# Link to your specific project
npx supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your project reference ID (e.g., `lgtldjzglbzlmmxphfxw`).

## Basic Workflow

### 1. Stop Local Supabase (if running)

```bash
npx supabase stop
```

### 2. Sync with Remote (Pull First)

```bash
# Check migration status
npx supabase migration list

# Pull latest schema (if needed)
npx supabase db pull

# If you get migration conflicts, repair them:
npx supabase migration repair --status applied MIGRATION_ID
```

### 3. Create a New Migration

```bash
# Create a new migration file
npx supabase migration new my_migration_name

# Edit the migration file in supabase/migrations/TIMESTAMP_my_migration_name.sql
```

### 4. Push Changes to Remote

```bash
# Push changes to remote
npx supabase db push
```

## Commands by Task

### Managing Schema

```bash
# Pull remote schema changes
npx supabase db pull

# View difference between local and remote
npx supabase db diff --use-migra --linked

# List remote tables 
npx supabase db remote tables
```

### Managing Migrations

```bash
# List migrations and their status
npx supabase migration list

# Repair a migration (mark as applied)
npx supabase migration repair --status applied MIGRATION_ID

# Repair a migration (mark as reverted)
npx supabase migration repair --status reverted MIGRATION_ID

# Apply local migrations to local DB
npx supabase db reset
```

### Testing Configuration

```bash
# Start local Supabase
npx supabase start

# Check status of local Supabase
npx supabase status

# View local Supabase Studio
# Visit: http://127.0.0.1:54323
```

## Troubleshooting

### Migration Conflicts

If you encounter errors like:

```
The remote database's migration history does not match local files
```

Use these commands to fix:

```bash
# For missing migrations that exist locally but not in remote:
npx supabase migration repair --status reverted MIGRATION_ID

# For migrations that exist in remote but not locally:
# 1. First back up existing migrations
mkdir -p supabase/migrations_backup_$(date +%Y%m%d)
cp -r supabase/migrations/* supabase/migrations_backup_$(date +%Y%m%d)/

# 2. Pull fresh schema
rm -rf supabase/migrations/*
npx supabase db pull
```

### Connection Issues

If you're having trouble connecting:

```bash
# Check your login status
npx supabase projects list

# Verify your project reference
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Empty Password Issue

If prompted for a password:

```bash
# When prompted for a password, just press Enter if it's empty
# OR use echo to automatically send an empty line
echo "\n" | npx supabase db pull
```

## Example Prompt Template

When asking Claude to help with Supabase operations, use this template:

```
Please help me update my remote Supabase instance using the CLI. I need to:

1. [Describe what changes you need to make]
2. [Specify any tables/schemas to modify]

The project reference is: [YOUR_PROJECT_REF]
I've already logged in with `supabase login`.

Please generate the necessary commands and SQL migration code to:
- Pull the latest schema
- Create a new migration for my changes
- Push the changes to the remote instance

Remember to handle any migration conflicts that might occur.
```

## Best Practices

1. **Always pull before pushing** to avoid conflicts
2. **Back up migrations** before major schema changes
3. **Use idempotent SQL** (with `IF NOT EXISTS` checks) in migrations
4. **Test migrations locally** before pushing to remote
5. **Fix migration history** with repair commands when needed
6. **Use the correct environment** (remote or local) based on your needs

By following this guide, you can effectively manage your remote Supabase instance through Cursor using Claude as your assistant. 