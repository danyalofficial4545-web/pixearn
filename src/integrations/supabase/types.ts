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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      daily_earnings: {
        Row: {
          coins: number
          day: string
          tasks: number
          user_id: string
        }
        Insert: {
          coins?: number
          day?: string
          tasks?: number
          user_id: string
        }
        Update: {
          coins?: number
          day?: string
          tasks?: number
          user_id?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          admin_note: string | null
          amount_pkr: number
          coins: number
          created_at: string
          id: string
          method: string
          screenshot_url: string | null
          status: string
          tid: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_pkr: number
          coins: number
          created_at?: string
          id?: string
          method: string
          screenshot_url?: string | null
          status?: string
          tid: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_pkr?: number
          coins?: number
          created_at?: string
          id?: string
          method?: string
          screenshot_url?: string | null
          status?: string
          tid?: string
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          daily_earning_coins: number
          daily_tasks: number
          id: string
          min_withdraw_coins: number
          name: string
          price_coins: number
          sort: number
          validity_days: number | null
          withdraw_options: number[]
        }
        Insert: {
          daily_earning_coins?: number
          daily_tasks?: number
          id: string
          min_withdraw_coins: number
          name: string
          price_coins?: number
          sort?: number
          validity_days?: number | null
          withdraw_options?: number[]
        }
        Update: {
          daily_earning_coins?: number
          daily_tasks?: number
          id?: string
          min_withdraw_coins?: number
          name?: string
          price_coins?: number
          sort?: number
          validity_days?: number | null
          withdraw_options?: number[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          created_at: string
          deposit_balance: number
          earning_balance: number
          email: string
          id: string
          package_expires_at: string | null
          package_id: string
          referral_code: string
          referred_by: string | null
          tasks_completed: number
          total_earned: number
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          deposit_balance?: number
          earning_balance?: number
          email: string
          id: string
          package_expires_at?: string | null
          package_id?: string
          referral_code: string
          referred_by?: string | null
          tasks_completed?: number
          total_earned?: number
          username: string
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          deposit_balance?: number
          earning_balance?: number
          email?: string
          id?: string
          package_expires_at?: string | null
          package_id?: string
          referral_code?: string
          referred_by?: string | null
          tasks_completed?: number
          total_earned?: number
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_earnings: {
        Row: {
          coins: number
          created_at: string
          from_user_id: string
          id: string
          kind: string
          referrer_id: string
        }
        Insert: {
          coins: number
          created_at?: string
          from_user_id: string
          id?: string
          kind: string
          referrer_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          from_user_id?: string
          id?: string
          kind?: string
          referrer_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          admin_note: string | null
          created_at: string
          game_user_id: string
          id: string
          screenshot_url: string | null
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          game_user_id: string
          id?: string
          screenshot_url?: string | null
          status?: string
          task_id: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          game_user_id?: string
          id?: string
          screenshot_url?: string | null
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          image_url: string | null
          play_store_link: string | null
          profit_coins: number
          reward_coins: number
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          play_store_link?: string | null
          profit_coins?: number
          reward_coins?: number
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          play_store_link?: string | null
          profit_coins?: number
          reward_coins?: number
          title?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          coins: number
          created_at: string
          id: string
          note: string | null
          type: string
          user_id: string
          wallet: string
        }
        Insert: {
          coins: number
          created_at?: string
          id?: string
          note?: string | null
          type: string
          user_id: string
          wallet: string
        }
        Update: {
          coins?: number
          created_at?: string
          id?: string
          note?: string | null
          type?: string
          user_id?: string
          wallet?: string
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
      withdrawals: {
        Row: {
          account_number: string
          account_title: string
          admin_note: string | null
          amount_pkr: number
          coins: number
          created_at: string
          id: string
          method: string
          status: string
          user_id: string
        }
        Insert: {
          account_number: string
          account_title: string
          admin_note?: string | null
          amount_pkr: number
          coins: number
          created_at?: string
          id?: string
          method: string
          status?: string
          user_id: string
        }
        Update: {
          account_number?: string
          account_title?: string
          admin_note?: string | null
          amount_pkr?: number
          coins?: number
          created_at?: string
          id?: string
          method?: string
          status?: string
          user_id?: string
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
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
