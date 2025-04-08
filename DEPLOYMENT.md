# Deployment Troubleshooting Guide

## Fixed Issues

### 1. Dependency Resolution Issues

Problem: Zod version conflict with AI package dependencies
```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error While resolving: ai@4.2.10
npm error Found: zod@3.22.4
npm error Could not resolve dependency: peer zod@"^3.23.8" from ai@4.2.10
```

Solution:
- Updated zod from `3.22.4` to `^3.24.2` in package.json
- Added `--legacy-peer-deps` flag to npm install in vercel.json

### 2. API Route Syntax Errors

Problem: Invalid syntax in route files after automatic import updates
```
Error: Cannot use a reserved word as a shorthand property
export async function GET(
  request: Request,
  {
  const supabaseAdmin = await getAdminClient(); params }: { params: { id: string } }
) {
```

Solution:
- Fixed syntax errors in `/app/api/admin/projects/[id]/route.ts` and `/app/api/projects/[slug]/images/route.ts` by properly moving the supabaseAdmin initialization inside the function body
- Improved the `update-api-imports.js` script to better handle function signatures and parameter blocks

### 3. Prisma Generation Issues

Problem: Outdated Prisma client when deploying to Vercel
```
Prisma has detected that this project was built on Vercel, which caches dependencies. This leads to an outdated Prisma Client because Prisma's auto-generation isn't triggered.
```

Solution:
- Added `postinstall` script to run `prisma generate`
- Modified build script to run `prisma generate` before `next build`
- Created vercel.json to explicitly configure the build process

## Deployment Steps

1. **Before deploying**:
   - Make sure all API files correctly use `getAdminClient()` instead of directly importing `supabaseAdmin`
   - Verify all function parameters are correctly formatted after import replacements
   - Run `npm install --legacy-peer-deps` locally to ensure package-lock.json is updated

2. **Set environment variables in Vercel**:
   - `DATABASE_URL` - Your Supabase PostgreSQL connection string
   - `DIRECT_URL` - Direct Supabase database URL (same as DATABASE_URL unless using pooling)
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
   
3. **Required configuration files**:
   - `vercel.json` with buildCommand and installCommand
   - `.env` (locally) with all required environment variables 
   - `.env.example` with example environment variables (excluding secrets)

## Local Development vs. Production

For local development using Prisma and production using Supabase:

1. **Local development**:
   - Uses Prisma Client for database access
   - Environment set up with direct database URL

2. **Production deployment**:
   - Uses Supabase client for API access
   - Uses `getAdminClient()` for admin operations
   - Environment set up with Supabase URL and service role key

When adding new API routes or modifying existing ones, ensure you:
1. Use `getAdminClient()` function rather than importing `supabaseAdmin` directly
2. Initialize the client inside each function with `const supabaseAdmin = await getAdminClient()` 