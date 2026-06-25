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
      blog_categories: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_avatar: string | null
          author_name: string
          category: string
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
          category: string
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
          category?: string
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
      condominium_aliases: {
        Row: {
          alias_normalized: string
          alias_text: string
          canonical_name: string
          canonical_normalized: string
          created_at: string
          id: string
        }
        Insert: {
          alias_normalized: string
          alias_text: string
          canonical_name: string
          canonical_normalized: string
          created_at?: string
          id?: string
        }
        Update: {
          alias_normalized?: string
          alias_text?: string
          canonical_name?: string
          canonical_normalized?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      condominiums: {
        Row: {
          city: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          highlights: Json
          id: string
          is_active: boolean
          name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          highlights?: Json
          id?: string
          is_active?: boolean
          name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          highlights?: Json
          id?: string
          is_active?: boolean
          name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_assignment_rule_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_assigned_at: string | null
          rule_id: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_assigned_at?: string | null
          rule_id: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_assigned_at?: string | null
          rule_id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_assignment_rule_members_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "crm_assignment_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_assignment_rules: {
        Row: {
          conditions: Json
          created_at: string
          distribution_type: string
          fixed_user_id: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          distribution_type: string
          fixed_user_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          distribution_type?: string
          fixed_user_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      crm_settings: {
        Row: {
          assignment_strategy: string
          assistant_sees_all: boolean
          created_at: string
          fallback_user_id: string | null
          id: string
          recurring_lead_enabled: boolean
          recurring_lead_window_months: number | null
          round_robin_pool: string[]
          rules_by_origin: Json
          updated_at: string
        }
        Insert: {
          assignment_strategy?: string
          assistant_sees_all?: boolean
          created_at?: string
          fallback_user_id?: string | null
          id?: string
          recurring_lead_enabled?: boolean
          recurring_lead_window_months?: number | null
          round_robin_pool?: string[]
          rules_by_origin?: Json
          updated_at?: string
        }
        Update: {
          assignment_strategy?: string
          assistant_sees_all?: boolean
          created_at?: string
          fallback_user_id?: string | null
          id?: string
          recurring_lead_enabled?: boolean
          recurring_lead_window_months?: number | null
          round_robin_pool?: string[]
          rules_by_origin?: Json
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string | null
          id: string
          property_id: string | null
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      lead_assignment_history: {
        Row: {
          changed_by: string | null
          created_at: string
          distribution_type: string | null
          from_user_id: string | null
          id: string
          lead_id: string
          matched_conditions: Json | null
          reason: string | null
          rule_id: string | null
          rule_name: string | null
          source: string | null
          to_user_id: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          distribution_type?: string | null
          from_user_id?: string | null
          id?: string
          lead_id: string
          matched_conditions?: Json | null
          reason?: string | null
          rule_id?: string | null
          rule_name?: string | null
          source?: string | null
          to_user_id?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          distribution_type?: string | null
          from_user_id?: string | null
          id?: string
          lead_id?: string
          matched_conditions?: Json | null
          reason?: string | null
          rule_id?: string | null
          rule_name?: string | null
          source?: string | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignment_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignment_history_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "crm_assignment_rules"
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
          assigned_at: string | null
          assigned_by: string | null
          assigned_user_id: string | null
          assignment_source: string | null
          avatar_url: string | null
          created_at: string
          deal_value: number | null
          email: string | null
          email_normalized: string | null
          id: string
          last_assignment_rule_id: string | null
          last_assignment_rule_name: string | null
          last_contact_at: string
          last_matched_conditions: Json | null
          name: string
          origin: string
          phone: string | null
          phone_normalized: string | null
          pipeline_stage: string
          property_id: string | null
          score: string
          updated_at: string
        }
        Insert: {
          ai_insights?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_user_id?: string | null
          assignment_source?: string | null
          avatar_url?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          email_normalized?: string | null
          id?: string
          last_assignment_rule_id?: string | null
          last_assignment_rule_name?: string | null
          last_contact_at?: string
          last_matched_conditions?: Json | null
          name: string
          origin?: string
          phone?: string | null
          phone_normalized?: string | null
          pipeline_stage?: string
          property_id?: string | null
          score?: string
          updated_at?: string
        }
        Update: {
          ai_insights?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_user_id?: string | null
          assignment_source?: string | null
          avatar_url?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          email_normalized?: string | null
          id?: string
          last_assignment_rule_id?: string | null
          last_assignment_rule_name?: string | null
          last_contact_at?: string
          last_matched_conditions?: Json | null
          name?: string
          origin?: string
          phone?: string | null
          phone_normalized?: string | null
          pipeline_stage?: string
          property_id?: string | null
          score?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_last_assignment_rule_id_fkey"
            columns: ["last_assignment_rule_id"]
            isOneToOne: false
            referencedRelation: "crm_assignment_rules"
            referencedColumns: ["id"]
          },
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
      pipeline_stages: {
        Row: {
          behavior: string
          color: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          label: string
          overdue_days: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          behavior?: string
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          label: string
          overdue_days?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          behavior?: string
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          overdue_days?: number | null
          sort_order?: number
          updated_at?: string
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
          condo_fee: number | null
          condominium: string | null
          condominium_normalized: string | null
          created_at: string | null
          description: string | null
          engineering_highlights: string[] | null
          external_id: string | null
          id: string
          iptu: number | null
          is_featured: boolean | null
          last_synced_at: string | null
          neighborhood: string | null
          parking_spots: number | null
          photos: string[] | null
          price: number | null
          property_type: string
          rental_price: number | null
          source: string
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
          condo_fee?: number | null
          condominium?: string | null
          condominium_normalized?: string | null
          created_at?: string | null
          description?: string | null
          engineering_highlights?: string[] | null
          external_id?: string | null
          id?: string
          iptu?: number | null
          is_featured?: boolean | null
          last_synced_at?: string | null
          neighborhood?: string | null
          parking_spots?: number | null
          photos?: string[] | null
          price?: number | null
          property_type?: string
          rental_price?: number | null
          source?: string
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
          condo_fee?: number | null
          condominium?: string | null
          condominium_normalized?: string | null
          created_at?: string | null
          description?: string | null
          engineering_highlights?: string[] | null
          external_id?: string | null
          id?: string
          iptu?: number | null
          is_featured?: boolean | null
          last_synced_at?: string | null
          neighborhood?: string | null
          parking_spots?: number | null
          photos?: string[] | null
          price?: number | null
          property_type?: string
          rental_price?: number | null
          source?: string
          status?: string | null
          title?: string
          transaction_type?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          new_value: string | null
          object_id: string | null
          object_label: string | null
          object_type: string
          old_value: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          object_id?: string | null
          object_label?: string | null
          object_type: string
          old_value?: string | null
          user_id?: string | null
          user_name?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          object_id?: string | null
          object_label?: string | null
          object_type?: string
          old_value?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      team_profiles: {
        Row: {
          availability: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          creci: string | null
          full_name: string
          id: string
          is_active: boolean
          last_assigned_at: string | null
          phone: string | null
          role_display: string | null
          social_instagram: string | null
          social_linkedin: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          creci?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          last_assigned_at?: string | null
          phone?: string | null
          role_display?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          creci?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          last_assigned_at?: string | null
          phone?: string | null
          role_display?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          broker_payout: number
          broker_user_id: string | null
          closed_at: string | null
          commission_pct: number
          created_at: string
          id: string
          property_id: string | null
          sale_value: number
          status: Database["public"]["Enums"]["transaction_status"]
        }
        Insert: {
          broker_payout?: number
          broker_user_id?: string | null
          closed_at?: string | null
          commission_pct?: number
          created_at?: string
          id?: string
          property_id?: string | null
          sale_value?: number
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Update: {
          broker_payout?: number
          broker_user_id?: string | null
          closed_at?: string | null
          commission_pct?: number
          created_at?: string
          id?: string
          property_id?: string | null
          sale_value?: number
          status?: Database["public"]["Enums"]["transaction_status"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      team_profiles_public: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          role_display: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          role_display?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          role_display?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_pipeline_stage: {
        Args: { p_key: string; p_reassign_to: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      normalize_search_text: { Args: { input: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "gerente"
        | "corretor"
        | "assistente"
      expense_category: "foto_video" | "trafego_pago" | "manutencao" | "outros"
      transaction_status: "pendente" | "pago" | "cancelado"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "gerente",
        "corretor",
        "assistente",
      ],
      expense_category: ["foto_video", "trafego_pago", "manutencao", "outros"],
      transaction_status: ["pendente", "pago", "cancelado"],
    },
  },
} as const
