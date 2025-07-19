export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          last_login: string | null
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      ai_image_generations: {
        Row: {
          category: string | null
          created_at: string | null
          cuisine_type: string | null
          error_message: string | null
          generation_cost: number
          id: string
          image_url: string
          menu_item_id: string | null
          prompt_used: string
          status: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          error_message?: string | null
          generation_cost: number
          id?: string
          image_url: string
          menu_item_id?: string | null
          prompt_used: string
          status?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          error_message?: string | null
          generation_cost?: number
          id?: string
          image_url?: string
          menu_item_id?: string | null
          prompt_used?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_image_generations_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_tracking: {
        Row: {
          budget_limit: number | null
          created_at: string | null
          id: string
          images_generated: number | null
          month_year: string
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          budget_limit?: number | null
          created_at?: string | null
          id?: string
          images_generated?: number | null
          month_year: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          budget_limit?: number | null
          created_at?: string | null
          id?: string
          images_generated?: number | null
          month_year?: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          content: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          section_name: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          section_name: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          section_name?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          current_participants: number | null
          description: string | null
          event_date: string
          id: string
          image_url: string | null
          is_active: boolean | null
          max_participants: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_participants?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          description?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_participants?: number | null
          title?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt_text: string | null
          category: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_featured: boolean | null
          title: string | null
        }
        Insert: {
          alt_text?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          title?: string | null
        }
        Update: {
          alt_text?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          title?: string | null
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          ai_generated_image: boolean | null
          ai_prompt_used: string | null
          category_id: string | null
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          dietary_tags: string[] | null
          display_order: number | null
          id: string
          image_generation_cost: number | null
          image_url: string | null
          ingredients: string | null
          is_available: boolean | null
          is_featured: boolean | null
          name: string
          regular_price: number | null
          student_price: number | null
          updated_at: string | null
        }
        Insert: {
          ai_generated_image?: boolean | null
          ai_prompt_used?: string | null
          category_id?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          display_order?: number | null
          id?: string
          image_generation_cost?: number | null
          image_url?: string | null
          ingredients?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name: string
          regular_price?: number | null
          student_price?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_generated_image?: boolean | null
          ai_prompt_used?: string | null
          category_id?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          display_order?: number | null
          id?: string
          image_generation_cost?: number | null
          image_url?: string | null
          ingredients?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name?: string
          regular_price?: number | null
          student_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      press_articles: {
        Row: {
          article_url: string
          created_at: string | null
          display_order: number | null
          excerpt: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          publication_date: string
          publication_name: string
          title: string
          updated_at: string | null
        }
        Insert: {
          article_url: string
          created_at?: string | null
          display_order?: number | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          publication_date: string
          publication_name: string
          title: string
          updated_at?: string | null
        }
        Update: {
          article_url?: string
          created_at?: string | null
          display_order?: number | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          publication_date?: string
          publication_name?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurant_videos: {
        Row: {
          autoplay: boolean | null
          created_at: string | null
          description: string | null
          display_order: number | null
          featured_for_hero: boolean | null
          id: string
          is_featured: boolean | null
          show_controls: boolean | null
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          autoplay?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured_for_hero?: boolean | null
          id?: string
          is_featured?: boolean | null
          show_controls?: boolean | null
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          autoplay?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          featured_for_hero?: boolean | null
          id?: string
          is_featured?: boolean | null
          show_controls?: boolean | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
