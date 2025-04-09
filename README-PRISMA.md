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

## Using AI to Update Supabase Schema with Prisma

### Step 1: Generate Schema Changes with AI

When you need to modify your database schema, use the following prompting pattern with AI:

```
Based on the current Prisma schema in my project, help me create the necessary changes to:
[DESCRIBE YOUR REQUIREMENT, e.g., "add a new table for storing user preferences"]

Current schema:
```prisma
// Paste relevant parts of your schema here, or ask AI to look at the file
```

Please provide:
1. The updated Prisma schema
2. A migration script to apply these changes
3. Any additional changes needed to existing code
```

### Step 2: Verify and Apply the Generated Schema

1. **Save the AI-generated schema** to `prisma/schema.prisma`

2. **Introspect to validate** (optional but recommended):
   ```bash
   npm run prisma:introspect
   ```
   This ensures the schema matches your existing database.

3. **Generate a migration**:
   ```bash
   npm run prisma:migrate:name descriptive_name_for_changes
   ```
   This creates a migration file in `prisma/migrations`.

4. **Review the generated migration** before applying to production.

5. **Apply the migration**:
   ```bash
   npm run prisma:migrate:deploy
   ```
   This applies the migration to your database.

### Step 3: Update Related Code

Ask AI to help update your application code to work with the schema changes:

```
Now that I've updated my Prisma schema with [DESCRIBE CHANGES], please help me update the following parts of my application:

1. Any server actions that need modification in app/actions/prisma-admin.ts
2. API endpoints that interact with these models
3. Types and interfaces that should reflect these changes
```

## Programmatic Schema Updates

For complex updates that need to be applied programmatically, use the following script pattern:

```javascript
// scripts/update-schema.js
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Function to update schema programmatically
async function updateSchema() {
  try {
    console.log('Starting schema update...');
    
    // 1. Modify the schema file
    const schemaPath = path.resolve('./prisma/schema.prisma');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Apply your changes to the schema
    schema = schema.replace(
      '// Add your model here',
      `model NewModel {
        id        String   @id @default(uuid())
        name      String
        createdAt DateTime @default(now())
      }`
    );
    
    fs.writeFileSync(schemaPath, schema);
    console.log('Schema file updated');
    
    // 2. Generate and run migration
    const migrationName = 'add_new_model_' + Date.now();
    execSync(`npx prisma migrate dev --name ${migrationName} --preview-feature`, { stdio: 'inherit' });
    console.log('Migration created and applied');
    
    // 3. Generate the Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Prisma client generated');
    
    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Schema update failed:', error);
    process.exit(1);
  }
}

updateSchema();
```

You can run this script with:
```bash
node scripts/update-schema.js
```

## Example AI-Generated Schema Changes

Here are some common patterns for AI-assisted schema changes:

### Adding a New Model

```
Help me add a new model called "UserPreference" to my Prisma schema that will store user UI preferences like theme, language, and accessibility settings. Each preference should be linked to a user ID.
```

### Adding a Relation Between Models

```
Help me create a many-to-many relationship between my "Project" and "Category" models in my Prisma schema, with appropriate relation tables and constraints.
```

### Modifying an Existing Model

```
I need to update the "Project" model in my Prisma schema to add a "featured" boolean field, a "priority" integer field for sorting, and make the "description" field optional.
```

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
- `ChatSession`: Stores conversation sessions for the AI chat
- `ChatHistory`: Stores individual messages in the chat
- `ChatProjects`: Links chat messages to relevant projects

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

## Best Practices for AI-Assisted Schema Changes

1. **Always review** AI-generated schema changes before applying them to production
2. **Test on development** first before applying to production
3. **Back up your database** before applying significant schema changes
4. **Use versioned migrations** rather than direct schema pushes for production
5. **Validate data integrity** after schema changes
6. **Keep migration names descriptive** to understand their purpose later
7. **Consider schema rollback strategy** for any migration
8. **Verify indices and constraints** are properly maintained
9. **Update types and interfaces** in your application to match schema changes
10. **Document schema changes** in your project documentation 