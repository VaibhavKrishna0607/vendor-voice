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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          district: string
          id: string
          name: string
          pincode: string | null
          state: string
        }
        Insert: {
          created_at?: string
          district: string
          id?: string
          name: string
          pincode?: string | null
          state?: string
        }
        Update: {
          created_at?: string
          district?: string
          id?: string
          name?: string
          pincode?: string | null
          state?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          area_id: string
          assigned_to: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          complainant_id: string
          created_at: string
          description: string
          id: string
          priority: number | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          area_id: string
          assigned_to?: string | null
          category: Database["public"]["Enums"]["complaint_category"]
          complainant_id: string
          created_at?: string
          description: string
          id?: string
          priority?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          area_id?: string
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["complaint_category"]
          complainant_id?: string
          created_at?: string
          description?: string
          id?: string
          priority?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          title?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_complainant_id_fkey"
            columns: ["complainant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area_id: string | null
          created_at: string
          full_name: string
          id: string
          is_verified: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string
          customer_id: string
          food_quality_rating: number | null
          hygiene_rating: number | null
          id: string
          price_rating: number | null
          rating: number
          review: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          food_quality_rating?: number | null
          hygiene_rating?: number | null
          id?: string
          price_rating?: number | null
          rating: number
          review?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          food_quality_rating?: number | null
          hygiene_rating?: number | null
          id?: string
          price_rating?: number | null
          rating?: number
          review?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          area_id: string
          average_rating: number | null
          business_name: string
          created_at: string
          food_types: string[] | null
          id: string
          is_licensed: boolean | null
          license_number: string | null
          location_description: string
          profile_id: string
          total_ratings: number | null
          updated_at: string
        }
        Insert: {
          area_id: string
          average_rating?: number | null
          business_name: string
          created_at?: string
          food_types?: string[] | null
          id?: string
          is_licensed?: boolean | null
          license_number?: string | null
          location_description: string
          profile_id: string
          total_ratings?: number | null
          updated_at?: string
        }
        Update: {
          area_id?: string
          average_rating?: number | null
          business_name?: string
          created_at?: string
          food_types?: string[] | null
          id?: string
          is_licensed?: boolean | null
          license_number?: string | null
          location_description?: string
          profile_id?: string
          total_ratings?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      complaint_category:
        | "food_quality"
        | "pricing"
        | "hygiene"
        | "location_issue"
        | "licensing"
        | "other"
      complaint_status: "pending" | "investigating" | "resolved" | "dismissed"
      user_role: "consumer" | "vendor" | "authority" | "admin"
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
      complaint_category: [
        "food_quality",
        "pricing",
        "hygiene",
        "location_issue",
        "licensing",
        "other",
      ],
      complaint_status: ["pending", "investigating", "resolved", "dismissed"],
      user_role: ["consumer", "vendor", "authority", "admin"],
    },
  },
} as const
