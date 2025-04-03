-- Migration: Add Journey Milestone Functions
-- Description: Creates SQL functions to handle journey milestone operations

-- Creating a function to handle journey milestone creation
-- This bypasses schema cache issues by using dynamic SQL

CREATE OR REPLACE FUNCTION create_journey_milestone(
  p_title TEXT,
  p_year TEXT,
  p_description TEXT,
  p_skills TEXT[],
  p_icon TEXT,
  p_color TEXT,
  p_image TEXT,
  p_display_order INTEGER
) RETURNS JSONB AS $$
DECLARE
  new_id UUID;
  result JSONB;
BEGIN
  -- Insert into journey_milestones table using dynamic SQL
  EXECUTE format(
    'INSERT INTO journey_milestones (
      title, year, description, skills, icon, color, image, display_order
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    ) RETURNING id, created_at, updated_at'
  ) INTO new_id USING 
    p_title, p_year, p_description, p_skills, p_icon, p_color, p_image, p_display_order;
  
  -- Construct the response JSON
  result := jsonb_build_object(
    'id', new_id,
    'title', p_title,
    'year', p_year,
    'description', p_description,
    'skills', to_jsonb(p_skills),
    'icon', p_icon,
    'color', p_color,
    'image', p_image,
    'display_order', p_display_order
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to update journey milestones
CREATE OR REPLACE FUNCTION update_journey_milestone(
  p_id UUID,
  p_title TEXT,
  p_year TEXT,
  p_description TEXT,
  p_skills TEXT[],
  p_icon TEXT,
  p_color TEXT,
  p_image TEXT,
  p_display_order INTEGER
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Update the journey milestone
  EXECUTE format(
    'UPDATE journey_milestones SET
      title = $1,
      year = $2,
      description = $3,
      skills = $4,
      icon = $5,
      color = $6,
      image = $7,
      display_order = $8,
      updated_at = now()
    WHERE id = $9
    RETURNING id, created_at, updated_at'
  ) INTO result USING 
    p_title, p_year, p_description, p_skills, p_icon, p_color, p_image, p_display_order, p_id;
  
  -- If the milestone doesn't exist, return null
  IF result IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Construct the response JSON
  result := jsonb_build_object(
    'id', p_id,
    'title', p_title,
    'year', p_year,
    'description', p_description,
    'skills', to_jsonb(p_skills),
    'icon', p_icon,
    'color', p_color,
    'image', p_image,
    'display_order', p_display_order
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to delete journey milestones
CREATE OR REPLACE FUNCTION delete_journey_milestone(
  p_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Delete the journey milestone
  EXECUTE format(
    'DELETE FROM journey_milestones WHERE id = $1'
  ) USING p_id;
  
  -- Check if the delete was successful
  GET DIAGNOSTICS success = ROW_COUNT;
  
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_journey_milestone TO authenticated;
GRANT EXECUTE ON FUNCTION update_journey_milestone TO authenticated;
GRANT EXECUTE ON FUNCTION delete_journey_milestone TO authenticated; 