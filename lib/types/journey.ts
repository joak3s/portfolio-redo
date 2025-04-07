import type { Database } from '../database.types';

// Define the JourneyImage type from our Supabase database
export type JourneyImage = Database['public']['Tables']['journey_images']['Row'];

// Define the JourneyEntry type from our Supabase database
export type JourneyEntry = Database['public']['Tables']['journey']['Row'] & {
  journey_images?: JourneyImage[];
};

// Legacy Milestone type for backward compatibility
export interface Milestone {
  id: string;
  title: string;
  subtitle?: string;
  year: string;
  description: string;
  skills: string[];
  icon: string;
  color: string;
  image?: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  // Adding journey_images for the new schema compatibility
  journey_images?: JourneyImage[];
}

// Input type for creating a new journey entry
export interface CreateJourneyInput {
  title: string;
  subtitle?: string | null;
  year: string;
  description: string;
  skills: string[];
  icon: string;
  color: string;
  display_order: number;
}

// Input type for updating an existing journey entry
export interface UpdateJourneyInput extends Partial<CreateJourneyInput> {
  id: string;
}

// Input type for adding an image to a journey entry
export interface AddJourneyImageInput {
  journey_id: string;
  url: string;
  alt_text?: string | null;
  order_index?: number | null;
}

// Input type for updating a journey image
export interface UpdateJourneyImageInput {
  id: string;
  url?: string;
  alt_text?: string | null;
  order_index?: number | null;
}

// Input for reordering images
export interface ReorderImagesInput {
  journey_id: string;
  image_ids: string[]; // Array of image IDs in the desired order
} 