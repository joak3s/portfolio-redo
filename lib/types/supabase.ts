export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          description: string
          content: string | null
          status: 'draft' | 'published'
          featured: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description: string
          content?: string | null
          status?: 'draft' | 'published'
          featured?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string
          content?: string | null
          status?: 'draft' | 'published'
          featured?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      project_images: {
        Row: {
          id: string
          project_id: string | null
          url: string
          alt_text: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          url: string
          alt_text?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          url?: string
          alt_text?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      project_tags: {
        Row: {
          project_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          project_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          project_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      project_tools: {
        Row: {
          project_id: string
          tool_id: string
          created_at: string
        }
        Insert: {
          project_id: string
          tool_id: string
          created_at?: string
        }
        Update: {
          project_id?: string
          tool_id?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      tools: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      journey_milestones: {
        Row: {
          id: string
          title: string
          year: string
          description: string
          skills: string[]
          icon: string
          color: string
          image: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          year: string
          description: string
          skills: string[]
          icon: string
          color: string
          image: string
          display_order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          year?: string
          description?: string
          skills?: string[]
          icon?: string
          color?: string
          image?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 