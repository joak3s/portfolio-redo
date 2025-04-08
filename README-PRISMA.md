# Prisma Integration with Supabase

This project uses Prisma as an ORM to interact with Supabase PostgreSQL database. The setup allows for secure development without exposing your Supabase service role key in version control.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Up Environment**:
   Make sure your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Generate Prisma Environment**:
   ```bash
   npm run prisma:setup
   ```
   This creates a secure `.env` file with the proper connection strings for Prisma.

4. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```
   This generates the Prisma client based on your schema.

## Database Management

### Running Migrations

To create and apply migrations to your Supabase database:

```bash
# Run a migration
npm run prisma:migrate

# Run a migration with a specific name
npm run prisma:migrate:name your_migration_name
```

### Cleaning Up Database

To clean up redundant views and fix column types:

```bash
npm run db:cleanup
```

### Using Prisma Studio

To open Prisma Studio (a visual database editor):

```bash
npm run prisma:studio
```

## Database Schema

The Prisma schema (`prisma/schema.prisma`) defines the following models:

- `Project`: Main project information
- `ProjectImage`: Images associated with projects
- `Tag`: Tags for categorizing projects
- `Tool`: Tools used in projects
- `ProjectTag`: Join table between projects and tags
- `ProjectTool`: Join table between projects and tools
- `Journey`: Career journey entries
- `JourneyImage`: Images associated with journey entries

## Switching from Supabase Client to Prisma

This project maintains both Supabase Client and Prisma-based implementations:

- **Supabase Client**: Used in original implementation and some endpoints
- **Prisma ORM**: Used in newer implementations for better type safety and query capabilities

### Server Actions

Server actions in `app/actions/prisma-admin.ts` use Prisma for database operations, providing:

- Type-safe database queries
- Transaction support
- Improved error handling

### API Endpoints

The API endpoints in folders like `app/api/projects` have been updated to use Prisma.

## Adding New Models

1. Update `prisma/schema.prisma` with your new model
2. Run migrations:
   ```bash
   npm run prisma:migrate:name add_new_model
   ```
3. Generate updated client:
   ```bash
   npm run prisma:generate
   ```

## Best Practices

1. Use Prisma's transactions for operations that update multiple tables
2. Always validate input data before sending to the database
3. Handle errors properly in all database operations
4. Keep the `.env` file out of version control (it's added to `.gitignore` automatically)
5. Use server actions or API endpoints for database operations, never expose direct database access to the client 