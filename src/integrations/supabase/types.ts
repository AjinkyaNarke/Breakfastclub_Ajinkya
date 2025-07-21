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
      about_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          section_id: string | null
          title: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          section_id?: string | null
          title?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          section_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "about_images_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "about_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      about_sections: {
        Row: {
          content: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_published: boolean | null
          section_key: string
          section_type: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          section_key: string
          section_type?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_published?: boolean | null
          section_key?: string
          section_type?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      consent_records: {
        Row: {
          analytics_cookies: boolean
          consent_timestamp: string
          consent_version: string
          created_at: string
          essential_cookies: boolean
          expires_at: string
          functional_cookies: boolean
          id: string
          ip_address: unknown | null
          language_preference: string
          marketing_cookies: boolean
          updated_at: string
          user_agent: string | null
          user_session_id: string
        }
        Insert: {
          analytics_cookies?: boolean
          consent_timestamp?: string
          consent_version?: string
          created_at?: string
          essential_cookies?: boolean
          expires_at?: string
          functional_cookies?: boolean
          id?: string
          ip_address?: unknown | null
          language_preference?: string
          marketing_cookies?: boolean
          updated_at?: string
          user_agent?: string | null
          user_session_id: string
        }
        Update: {
          analytics_cookies?: boolean
          consent_timestamp?: string
          consent_version?: string
          created_at?: string
          essential_cookies?: boolean
          expires_at?: string
          functional_cookies?: boolean
          id?: string
          ip_address?: unknown | null
          language_preference?: string
          marketing_cookies?: boolean
          updated_at?: string
          user_agent?: string | null
          user_session_id?: string
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
      cookie_categories: {
        Row: {
          category_key: string
          created_at: string
          description_de: string
          description_en: string
          display_order: number
          id: string
          is_active: boolean
          is_essential: boolean
          name_de: string
          name_en: string
          updated_at: string
        }
        Insert: {
          category_key: string
          created_at?: string
          description_de: string
          description_en: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_essential?: boolean
          name_de: string
          name_en: string
          updated_at?: string
        }
        Update: {
          category_key?: string
          created_at?: string
          description_de?: string
          description_en?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_essential?: boolean
          name_de?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      cookie_definitions: {
        Row: {
          category_id: string
          cookie_name: string
          created_at: string
          duration: string
          id: string
          is_active: boolean
          purpose_de: string
          purpose_en: string
          third_party_provider: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          cookie_name: string
          created_at?: string
          duration: string
          id?: string
          is_active?: boolean
          purpose_de: string
          purpose_en: string
          third_party_provider?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          cookie_name?: string
          created_at?: string
          duration?: string
          id?: string
          is_active?: boolean
          purpose_de?: string
          purpose_en?: string
          third_party_provider?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cookie_definitions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cookie_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      data_subject_requests: {
        Row: {
          admin_notes: string | null
          completed_at: string | null
          created_at: string
          id: string
          request_details: string | null
          request_type: string
          requester_email: string
          requester_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          request_details?: string | null
          request_type: string
          requester_email: string
          requester_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          request_details?: string | null
          request_type?: string
          requester_email?: string
          requester_name?: string | null
          status?: string
          updated_at?: string
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
      ingredient_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          allergens: string[] | null
          category_id: string | null
          cost_per_unit: number | null
          created_at: string
          dietary_properties: string[] | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          seasonal_availability: string[] | null
          supplier_info: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string
          dietary_properties?: string[] | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          seasonal_availability?: string[] | null
          supplier_info?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          category_id?: string | null
          cost_per_unit?: number | null
          created_at?: string
          dietary_properties?: string[] | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          seasonal_availability?: string[] | null
          supplier_info?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ingredient_categories"
            referencedColumns: ["id"]
          },
        ]
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
      menu_item_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          menu_item_id: string
          notes: string | null
          quantity: number
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          menu_item_id: string
          notes?: string | null
          quantity: number
          unit: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          menu_item_id?: string
          notes?: string | null
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_ingredients_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
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
      privacy_policy_versions: {
        Row: {
          content_de: string
          content_en: string
          created_at: string
          id: string
          is_active: boolean
          published_at: string | null
          updated_at: string
          version_number: string
        }
        Insert: {
          content_de: string
          content_en: string
          created_at?: string
          id?: string
          is_active?: boolean
          published_at?: string | null
          updated_at?: string
          version_number: string
        }
        Update: {
          content_de?: string
          content_en?: string
          created_at?: string
          id?: string
          is_active?: boolean
          published_at?: string | null
          updated_at?: string
          version_number?: string
        }
        Relationships: []
      }
      reservation_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          admin_notes: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          language_preference: string | null
          party_size: number
          reservation_date: string
          reservation_time: string
          special_requests: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          language_preference?: string | null
          party_size: number
          reservation_date: string
          reservation_time: string
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          language_preference?: string | null
          party_size?: number
          reservation_date?: string
          reservation_time?: string
          special_requests?: string | null
          status?: string | null
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
