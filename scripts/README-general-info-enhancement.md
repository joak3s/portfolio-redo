# General Info Table Enhancement

This document explains how to implement and utilize the enhanced general_info table structure to improve chat responses.

## Overview of Changes

The general_info table has been enhanced with:

1. **Structural Improvements**:
   - Added `updated_at` timestamp for tracking changes
   - Added `source` field to track where content originated
   - Added `parent_id` to create relationships between full content and chunks
   - Added `embedding_id` to link directly to the embeddings table
   - Added `relevance` score (0.0-1.0) to prioritize important content
   - Added `is_chunked` flag to identify split content

2. **Database Optimizations**:
   - Added indexes on `category` and `parent_id` for faster queries
   - Modified the `hybrid_search` function to leverage relevance scores
   - Updated query patterns for faster, more accurate responses

3. **New Scripts**:
   - `optimize-general-info.js` - Splits content into smaller, more focused pieces
   - `generate-embeddings.js` - Generates embeddings for all general_info records

## Implementation Steps

Follow these steps to implement the enhancements:

### 1. Run Database Migrations

```bash
# Apply the SQL migration to add new fields and update functions
cd supabase
supabase migration apply
```

Alternatively, you can manually run the `general_info_update.sql` migration file against your Supabase database.

### 2. Update Your Schema

Update your Prisma schema to match the new table structure, then generate Prisma client:

```bash
npx prisma db pull
npx prisma generate
```

### 3. Optimize Content (Optional)

If you want to split longer content into more granular pieces for better search relevance:

```bash
# Run the optimization script (backs up data first)
node scripts/optimize-general-info.js
```

### 4. Generate Embeddings

Generate embeddings for all general_info records:

```bash
# Generate embeddings for improved semantic search
node scripts/generate-embeddings.js
```

## How It Works

1. **Content Organization**: 
   - Full content pieces are stored with `is_chunked = false`
   - When split, related chunks have `parent_id` linking to the original
   - Each record can have its own relevance score

2. **Search Improvement**:
   - Direct category matches use exact category matching
   - The `relevance` field boosts important content in results
   - Embedding relationships speed up hybrid searches

3. **Response Enhancement**:
   - Chat responses now prefer highly relevant content
   - Category-specific questions get more focused answers
   - The system can retrieve full content or specific chunks as needed

## Managing Content

When adding new content to the general_info table:

1. Set appropriate `category` values to help with classification
2. Assign `relevance` scores (0.0-1.0) based on importance (1.0 = most important)
3. After adding content, run `generate-embeddings.js` to create embeddings

## Best Practices

- **Content Length**: Keep original content moderate in length; the chunking process works best with 2-5 paragraphs
- **Categories**: Use consistent category names (`background`, `skills`, `contact`, `projects`, `services`)
- **Relevance**: Reserve high relevance (>0.8) for truly critical information
- **Regular Updates**: Re-run the embedding generation after content changes

## Troubleshooting

If search results aren't returning expected content:

1. Check that embeddings exist for all content
2. Verify relevance scores are appropriate
3. Ensure categories are correctly assigned
4. Look for very long content that might need splitting 