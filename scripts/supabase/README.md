# Supabase RAG Scripts

This directory contains scripts for managing the RAG (Retrieval Augmented Generation) system using Supabase.

## Available Scripts

### 1. `deploy-hybrid-search.js`

Deploys the `hybrid_search` SQL function to your Supabase project. This function handles both vector similarity search and keyword-based search.

```bash
node scripts/supabase/deploy-hybrid-search.js
```

The script will output the SQL that should be run in the Supabase SQL Editor.

### 2. `test-hybrid-search.js`

Tests the `hybrid_search` SQL function with a specific query to see how well it retrieves relevant content.

```bash
node scripts/supabase/test-hybrid-search.js "Your test query here"
```

Example:
```bash
node scripts/supabase/test-hybrid-search.js "Tell me about Jordan's work on Kosei Performance"
```

### 3. `embed-project-summaries.js`

Generates or updates vector embeddings for project summaries to improve relevance in search results.

```bash
node scripts/supabase/embed-project-summaries.js
```

This script:
- Fetches all projects from the database
- Generates embeddings for each project's summary
- Updates existing embeddings or creates new ones

### 4. `format-project-summaries.js`

Ensures all project summaries are consistently formatted and properly embedded for RAG retrieval.

```bash
node scripts/supabase/format-project-summaries.js
```

This script:
- Processes all projects in the database
- Creates consistent embedding representations for each project
- Updates the vector embeddings in Supabase
- Generates a detailed log file of all changes

## Files

- `hybrid-search-summary.sql`: The SQL function definition for hybrid search using project summaries
- `deploy-hybrid-search.js`: Deployment script for the SQL function
- `test-hybrid-search.js`: Testing script for the hybrid search
- `embed-project-summaries.js`: Script to generate embeddings for project summaries
- `format-project-summaries.js`: Script to ensure consistent project summaries

## Workflow

1. Update project summaries in the Supabase database
2. Run `embed-project-summaries.js` to generate vector embeddings
3. Deploy the updated SQL function using `deploy-hybrid-search.js`
4. Test the search functionality with `test-hybrid-search.js`

## Note on Project Summaries

The system now uses the `summary` field from projects instead of the previous `description` field. The summary provides more detailed information about each project for better context in AI responses.

## Embedding Scripts

- **generate-embeddings.js**: Generates vector embeddings for content in the database.
  - Usage: `node generate-embeddings.js [content_type]`
  - Options: `all`, `general_info`, or `projects`
  - Example: `node generate-embeddings.js projects`

## Hybrid Search SQL

- **fix-hybrid-search.sql**: Basic hybrid search function combining vector and text search.
- **fix-hybrid-search-v2.sql**: Improved version with fully qualified column references to avoid ambiguity.

## Testing & Deployment

- **test-hybrid-search.js**: Comprehensive diagnostic tool for testing the hybrid search functionality.
- **validate-hybrid-search.js**: Simple validation script for the hybrid search function.
- **deploy-hybrid-search.js**: Script to deploy the hybrid search SQL function to Supabase.

## Database Schema

The RAG system uses the following tables:

- **general_info**: General information about skills, background, and expertise.
- **projects**: Project details including descriptions, tools, tags.
- **embeddings**: Stores vector embeddings for content from both tables.

## Workflow

1. Update content in `general_info` or `projects` tables
2. Run `generate-embeddings.js` to create embeddings for the content
3. Ensure the `hybrid_search` function is properly deployed
4. Test the RAG system through the `/test-rag` page interface

## Best Practices

- Always check for existing embeddings before creating new ones
- When updating the `hybrid_search` function, use explicit aliases to avoid column ambiguity
- Keep embedding dimensions at 1536 for the text-embedding-3-small model
- Include descriptive metadata in embeddings for better context retrieval 