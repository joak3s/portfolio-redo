# Scripts Directory

This directory contains utility scripts for the portfolio-redo project, focusing on the RAG Chat system, database management, and testing.

## Testing Scripts

- **test-query-optimization.js** - Tests performance improvements in query intent analysis and response times
- **test-chat-project-response.js** - Tests if project images are correctly returned in chat responses
- **test-project-images.js** - Validates project image retrieval functionality
- **test-with-local-env.js** - Script for testing with local environment variables
- **run-project-test.js** - Tests project-related functionality

## Database Utility Scripts

- **create-save-chat-project-function.js** - Creates the database function to save project associations with chat messages
- **update-chat-projects-table.js** - Updates the chat_projects table structure
- **direct-function-test.js** - Directly tests database functions
- **direct-sql-test.js** - Performs direct SQL queries for testing
- **chat-analytics-table.sql** - SQL schema for chat analytics table
- **inspect-schema.js** - Inspects database schema

## Prisma Scripts

- **prisma-introspect.js** - Runs Prisma introspection for database schema updates
- **prisma-migrate.js** - Manages Prisma migrations

## Utility Scripts

- **cleanup-db.js** - Cleans up unused database entries
- **setup-env.js** - Sets up environment variables
- **update-api-imports.js** - Updates API imports in the codebase
- **check-project-images.js** - Checks for proper project image relationships
- **debug-project-image-issue.js** - Debug script for project image display issues

## Environment

- **.env.example** - Example environment variables needed for scripts

## Documentation

- **README-rag-chat-migration.md** - Documentation about the RAG Chat system database migration 