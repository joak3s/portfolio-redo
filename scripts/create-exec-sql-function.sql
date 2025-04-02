-- Create a function that allows executing arbitrary SQL queries
-- This creates the exec_sql function that can be called via the REST API
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$; 