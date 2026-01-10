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
      connected_devices: {
        Row: {
          baseline_data: Json | null
          claimed_at: string
          created_at: string
          device_id: string
          device_metadata: Json | null
          device_name: string | null
          device_type: string
          id: string
          last_minted_at: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_data?: Json | null
          claimed_at?: string
          created_at?: string
          device_id: string
          device_metadata?: Json | null
          device_name?: string | null
          device_type: string
          id?: string
          last_minted_at?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_data?: Json | null
          claimed_at?: string
          created_at?: string
          device_id?: string
          device_metadata?: Json | null
          device_name?: string | null
          device_type?: string
          id?: string
          last_minted_at?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_production: {
        Row: {
          consumption_wh: number | null
          created_at: string
          device_id: string
          id: string
          production_wh: number
          provider: string
          recorded_at: string
          user_id: string
        }
        Insert: {
          consumption_wh?: number | null
          created_at?: string
          device_id: string
          id?: string
          production_wh?: number
          provider: string
          recorded_at: string
          user_id: string
        }
        Update: {
          consumption_wh?: number | null
          created_at?: string
          device_id?: string
          id?: string
          production_wh?: number
          provider?: string
          recorded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      energy_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          extra_data: Json | null
          id: string
          provider: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          extra_data?: Json | null
          id?: string
          provider: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          extra_data?: Json | null
          id?: string
          provider?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          body: string
          data: Json | null
          id: string
          notification_type: string
          sent_at: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          data?: Json | null
          id?: string
          notification_type: string
          sent_at?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          data?: Json | null
          id?: string
          notification_type?: string
          sent_at?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          enphase_connected: boolean | null
          facebook_connected: boolean | null
          facebook_handle: string | null
          id: string
          instagram_connected: boolean | null
          instagram_handle: string | null
          is_admin: boolean | null
          linkedin_connected: boolean | null
          linkedin_handle: string | null
          solaredge_connected: boolean | null
          tesla_connected: boolean | null
          tiktok_connected: boolean | null
          tiktok_handle: string | null
          twitter_connected: boolean | null
          twitter_handle: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          enphase_connected?: boolean | null
          facebook_connected?: boolean | null
          facebook_handle?: string | null
          id?: string
          instagram_connected?: boolean | null
          instagram_handle?: string | null
          is_admin?: boolean | null
          linkedin_connected?: boolean | null
          linkedin_handle?: string | null
          solaredge_connected?: boolean | null
          tesla_connected?: boolean | null
          tiktok_connected?: boolean | null
          tiktok_handle?: string | null
          twitter_connected?: boolean | null
          twitter_handle?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          enphase_connected?: boolean | null
          facebook_connected?: boolean | null
          facebook_handle?: string | null
          id?: string
          instagram_connected?: boolean | null
          instagram_handle?: string | null
          is_admin?: boolean | null
          linkedin_connected?: boolean | null
          linkedin_handle?: string | null
          solaredge_connected?: boolean | null
          tesla_connected?: boolean | null
          tiktok_connected?: boolean | null
          tiktok_handle?: string | null
          twitter_connected?: boolean | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_info: Json | null
          endpoint: string
          id: string
          p256dh: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_info?: Json | null
          endpoint: string
          id?: string
          p256dh: string
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_info?: Json | null
          endpoint?: string
          id?: string
          p256dh?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          calculated_at: string
          claimed: boolean
          claimed_at: string | null
          created_at: string
          energy_wh_basis: number
          id: string
          reward_type: string
          tokens_earned: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          energy_wh_basis?: number
          id?: string
          reward_type?: string
          tokens_earned?: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          energy_wh_basis?: number
          id?: string
          reward_type?: string
          tokens_earned?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_device_claimed: {
        Args: {
          _current_user_id?: string
          _device_id: string
          _provider: string
        }
        Returns: Json
      }
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
