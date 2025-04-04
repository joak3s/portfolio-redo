# Supabase Configuration

This project uses Supabase for backend services. The project is configured to work with both a remote Supabase instance and an optional local development environment.

## Remote Supabase Setup

The primary database is hosted at:
```
https://lgtldjzglbzlmmxphfxw.supabase.co
```

This is configured in the `.env.local` file for production use.

## Local Development Setup

For local development, you can run Supabase locally:

1. Install Supabase CLI:
   ```bash
   brew install supabase/tap/supabase
   ```

2. Start the local Supabase instance:
   ```bash
   supabase start
   ```

3. Use the `.env.development.local` file for local development.

## Managing Migrations

The project is currently set up with the following migration:
- `20250327232627_journey_milestones.sql` - Initial journey milestones schema

### Creating New Migrations

To create a new migration:
```bash
supabase migration new my_migration_name
```

This will create a new file in the `supabase/migrations` directory.

### Applying Migrations to Remote

To apply migrations to the remote Supabase instance:
```bash
supabase db push
```

### Viewing Migration Status

To see which migrations have been applied:
```bash
supabase migration list
```

## Backup Migrations

Any discarded migrations are stored in `supabase/migrations_backup` for reference.

## Schema Differences

To see differences between your local schema and the remote schema:
```bash
supabase db diff
```

## Notes

- Always ensure your migrations are backward compatible
- The project is linked to the remote Supabase project with reference ID `lgtldjzglbzlmmxphfxw`
- Local Supabase development provides a complete environment including authentication, database, storage, and more 