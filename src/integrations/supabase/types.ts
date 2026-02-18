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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          auth_user_id: string
          company_id: string
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          auth_user_id: string
          company_id: string
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Update: {
          auth_user_id?: string
          company_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_profiles: {
        Row: {
          catalog_version_id: string
          id: string
          kind: string
          meta: Json | null
          polyline_mm: Json
        }
        Insert: {
          catalog_version_id: string
          id?: string
          kind: string
          meta?: Json | null
          polyline_mm?: Json
        }
        Update: {
          catalog_version_id?: string
          id?: string
          kind?: string
          meta?: Json | null
          polyline_mm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "catalog_profiles_catalog_version_id_fkey"
            columns: ["catalog_version_id"]
            isOneToOne: false
            referencedRelation: "catalog_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_versions: {
        Row: {
          company_id: string
          created_at: string
          id: string
          status: string
          version: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          status?: string
          version: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          status?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_versions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active_catalog_version_id: string | null
          branding: Json | null
          created_at: string
          ghl_chat_embed: string | null
          ghl_webhook_url: string | null
          id: string
          name: string
        }
        Insert: {
          active_catalog_version_id?: string | null
          branding?: Json | null
          created_at?: string
          ghl_chat_embed?: string | null
          ghl_webhook_url?: string | null
          id?: string
          name: string
        }
        Update: {
          active_catalog_version_id?: string | null
          branding?: Json | null
          created_at?: string
          ghl_chat_embed?: string | null
          ghl_webhook_url?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_active_catalog_version"
            columns: ["active_catalog_version_id"]
            isOneToOne: false
            referencedRelation: "catalog_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          meta: Json | null
          project_id: string | null
          revision_id: string | null
          type: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          project_id?: string | null
          revision_id?: string | null
          type: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          project_id?: string | null
          revision_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      exports: {
        Row: {
          created_at: string
          id: string
          meta: Json | null
          revision_id: string
          storage_path: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json | null
          revision_id: string
          storage_path: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json | null
          revision_id?: string
          storage_path?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string
          created_at: string
          customer: Json
          id: string
          site: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          customer?: Json
          id?: string
          site?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          customer?: Json
          id?: string
          site?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      revisions: {
        Row: {
          catalog_version_id: string | null
          config: Json
          created_at: string
          created_by: string | null
          id: string
          parts: Json | null
          pricing: Json | null
          project_id: string
          scan_placeholder: Json | null
          site_context: Json | null
        }
        Insert: {
          catalog_version_id?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          parts?: Json | null
          pricing?: Json | null
          project_id: string
          scan_placeholder?: Json | null
          site_context?: Json | null
        }
        Update: {
          catalog_version_id?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          parts?: Json | null
          pricing?: Json | null
          project_id?: string
          scan_placeholder?: Json | null
          site_context?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "revisions_catalog_version_id_fkey"
            columns: ["catalog_version_id"]
            isOneToOne: false
            referencedRelation: "catalog_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          catalog_version_id: string
          id: string
          json: Json
          rule_type: string
          severity: string
        }
        Insert: {
          catalog_version_id: string
          id?: string
          json?: Json
          rule_type: string
          severity?: string
        }
        Update: {
          catalog_version_id?: string
          id?: string
          json?: Json
          rule_type?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "rules_catalog_version_id_fkey"
            columns: ["catalog_version_id"]
            isOneToOne: false
            referencedRelation: "catalog_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          revision_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          revision_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          revision_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_tokens_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      skus: {
        Row: {
          catalog_version_id: string
          category: string
          id: string
          meta: Json | null
          sku_code: string
        }
        Insert: {
          catalog_version_id: string
          category: string
          id?: string
          meta?: Json | null
          sku_code: string
        }
        Update: {
          catalog_version_id?: string
          category?: string
          id?: string
          meta?: Json | null
          sku_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "skus_catalog_version_id_fkey"
            columns: ["catalog_version_id"]
            isOneToOne: false
            referencedRelation: "catalog_versions"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "sales_rep"
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
      app_role: ["admin", "sales_rep"],
    },
  },
} as const
