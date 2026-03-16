export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_avatar: string | null
          author_name: string
          category: Database["public"]["Enums"]["blog_category"]
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_exclusive: boolean
          is_featured: boolean
          published_at: string
          reading_time_min: number
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string
          category: Database["public"]["Enums"]["blog_category"]
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_exclusive?: boolean
          is_featured?: boolean
          published_at?: string
          reading_time_min?: number
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          category?: Database["public"]["Enums"]["blog_category"]
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_exclusive?: boolean
          is_featured?: boolean
          published_at?: string
          reading_time_min?: number
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          created_at: string
          description: string
          id: string
          lead_id: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          lead_id: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          lead_id: string
        }
        Insert: {
          author?: string
          content: string
          created_at?: string
          id?: string
          lead_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_insights: string | null
          avatar_url: string | null
          created_at: string
          deal_value: number | null
          email: string | null
          id: string
          last_contact_at: string
          name: string
          origin: string
          phone: string | null
          pipeline_stage: string
          property_id: string | null
          score: string
          updated_at: string
        }
        Insert: {
          ai_insights?: string | null
          avatar_url?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          id?: string
          last_contact_at?: string
          name: string
          origin?: string
          phone?: string | null
          pipeline_stage?: string
          property_id?: string | null
          score?: string
          updated_at?: string
        }
        Update: {
          ai_insights?: string | null
          avatar_url?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          id?: string
          last_contact_at?: string
          name?: string
          origin?: string
          phone?: string | null
          pipeline_stage?: string
          property_id?: string | null
          score?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data: {
        Row: {
          avg_price_sqm: number
          created_at: string
          id: string
          month: string
          region: string
          year: number
        }
        Insert: {
          avg_price_sqm: number
          created_at?: string
          id?: string
          month: string
          region?: string
          year: number
        }
        Update: {
          avg_price_sqm?: number
          created_at?: string
          id?: string
          month?: string
          region?: string
          year?: number
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          area_built: number | null
          area_total: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          code: string
          condominium: string | null
          created_at: string | null
          description: string | null
          engineering_highlights: string[] | null
          id: string
          is_featured: boolean | null
          neighborhood: string | null
          parking_spots: number | null
          photos: string[] | null
          price: number | null
          property_type: string
          rental_price: number | null
          status: string | null
          title: string
          transaction_type: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          address?: string | null
          area_built?: number | null
          area_total?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          code: string
          condominium?: string | null
          created_at?: string | null
          description?: string | null
          engineering_highlights?: string[] | null
          id?: string
          is_featured?: boolean | null
          neighborhood?: string | null
          parking_spots?: number | null
          photos?: string[] | null
          price?: number | null
          property_type?: string
          rental_price?: number | null
          status?: string | null
          title: string
          transaction_type?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          address?: string | null
          area_built?: number | null
          area_total?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          code?: string
          condominium?: string | null
          created_at?: string | null
          description?: string | null
          engineering_highlights?: string[] | null
          id?: string
          is_featured?: boolean | null
          neighborhood?: string | null
          parking_spots?: number | null
          photos?: string[] | null
          price?: number | null
          property_type?: string
          rental_price?: number | null
          status?: string | null
          title?: string
          transaction_type?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits_scheduling: {
        Row: {
          broker_name: string
          created_at: string
          id: string
          lead_email: string
          lead_name: string
          lead_phone: string
          property_code: string
          visit_date: string
          visit_time: string
        }
        Insert: {
          broker_name: string
          created_at?: string
          id?: string
          lead_email: string
          lead_name: string
          lead_phone: string
          property_code: string
          visit_date: string
          visit_time: string
        }
        Update: {
          broker_name?: string
          created_at?: string
          id?: string
          lead_email?: string
          lead_name?: string
          lead_phone?: string
          property_code?: string
          visit_date?: string
          visit_time?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      blog_category:
        | "inside-alphaville"
        | "arquitetura-design"
        | "investimento"
        | "guia-condominios"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      blog_category: [
        "inside-alphaville",
        "arquitetura-design",
        "investimento",
        "guia-condominios",
      ],
    },
  },
} as const
